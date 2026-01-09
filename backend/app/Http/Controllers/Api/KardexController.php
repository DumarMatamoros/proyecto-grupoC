<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KardexController extends Controller
{
    /**
     * Listar todos los productos con resumen de kardex
     */
    public function index(Request $request)
    {
        $query = Producto::with('categoria');

        // Filtro por categoría
        if ($request->filled('categoria_id')) {
            $query->where('categoria_id', $request->categoria_id);
        }

        // Filtro por búsqueda
        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'ILIKE', "%{$buscar}%")
                  ->orWhere('codigo_principal', 'ILIKE', "%{$buscar}%")
                  ->orWhere('codigo_barras', 'ILIKE', "%{$buscar}%");
            });
        }

        // Filtro por stock bajo
        if ($request->filled('stock_bajo') && $request->stock_bajo) {
            $query->whereColumn('stock_actual', '<=', 'stock_minimo');
        }

        // Filtro por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $productos = $query->orderBy('nombre')->get();

        // Agregar información de movimientos a cada producto
        $kardexResumen = $productos->map(function ($producto) {
            $movimientos = MovimientoInventario::where('producto_id', $producto->producto_id)->get();
            
            $totalEntradas = $movimientos->sum('cantidad_entrada');
            $totalSalidas = $movimientos->sum('cantidad_salida');
            $ultimoMovimiento = $movimientos->sortByDesc('created_at')->first();

            // Contar lotes activos
            $lotesActivos = Lote::where('producto_id', $producto->producto_id)
                ->where('cantidad_disponible', '>', 0)
                ->count();

            return [
                'producto_id' => $producto->producto_id,
                'codigo_principal' => $producto->codigo_principal,
                'codigo_barras' => $producto->codigo_barras,
                'nombre' => $producto->nombre,
                'categoria' => $producto->categoria->nombre ?? 'Sin categoría',
                'stock_actual' => $producto->stock_actual,
                'stock_minimo' => $producto->stock_minimo ?? 10,
                'stock_maximo' => $producto->stock_maximo ?? 1000,
                'precio_costo' => $producto->precio_costo,
                'costo_promedio' => $producto->costo_promedio,
                'precio_unitario' => $producto->precio_unitario,
                'margen_ganancia' => $producto->margen_ganancia ?? 30,
                'modo_precio' => $producto->modo_precio ?? 'automatico',
                'total_entradas' => $totalEntradas,
                'total_salidas' => $totalSalidas,
                'total_movimientos' => $movimientos->count(),
                'lotes_activos' => $lotesActivos,
                'ultimo_movimiento' => $ultimoMovimiento ? $ultimoMovimiento->created_at : null,
                'estado' => $producto->estado ?? 'activo',
            ];
        });

        return response()->json([
            'productos' => $kardexResumen,
            'total' => $kardexResumen->count(),
        ]);
    }

    /**
     * Ver el kardex detallado de un producto (todos los movimientos)
     */
    public function show($productoId, Request $request)
    {
        $producto = Producto::with('categoria')->findOrFail($productoId);

        $query = MovimientoInventario::where('producto_id', $productoId)
            ->with(['lote', 'usuario']);

        // Filtrar por fechas
        if ($request->filled('fecha_inicio')) {
            $query->where(function($q) use ($request) {
                $q->whereDate('fecha', '>=', $request->fecha_inicio)
                  ->orWhereDate('created_at', '>=', $request->fecha_inicio);
            });
        }
        if ($request->filled('fecha_fin')) {
            $query->where(function($q) use ($request) {
                $q->whereDate('fecha', '<=', $request->fecha_fin)
                  ->orWhereDate('created_at', '<=', $request->fecha_fin);
            });
        }

        // Filtrar por tipo de movimiento
        if ($request->filled('tipo_movimiento')) {
            $query->where('tipo_movimiento', $request->tipo_movimiento);
        }

        $movimientos = $query->orderBy('created_at', 'asc')->get();

        // Calcular saldo acumulado (Kardex)
        $saldo = 0;
        $kardex = [];

        foreach ($movimientos as $mov) {
            $entrada = $mov->cantidad_entrada ?? 0;
            $salida = $mov->cantidad_salida ?? 0;
            $saldo = $saldo + $entrada - $salida;

            // Usar fecha del movimiento si existe, sino created_at
            $fechaMov = $mov->fecha ?? $mov->created_at;

            $kardex[] = [
                'movimiento_id' => $mov->movimiento_id,
                'fecha' => $fechaMov ? (is_string($fechaMov) ? $fechaMov : $fechaMov->format('Y-m-d H:i:s')) : null,
                'tipo_movimiento' => strtoupper($mov->tipo_movimiento),
                'tipo_documento' => $mov->tipo_documento,
                'numero_documento' => $mov->numero_documento,
                'referencia' => $mov->referencia,
                'lote_id' => $mov->lote_id,
                'entrada' => $entrada,
                'salida' => $salida,
                'saldo' => $saldo,
                'costo_unitario' => $mov->costo_unitario,
                'usuario' => $mov->usuario->nombre ?? 'Sistema',
                'observaciones' => $mov->observaciones,
            ];
        }

        // Obtener lotes del producto
        $lotes = Lote::where('producto_id', $productoId)
            ->orderBy('fecha_ingreso', 'asc')
            ->get()
            ->map(function ($lote) {
                return [
                    'lote_id' => $lote->lote_id,
                    'fecha_ingreso' => $lote->fecha_ingreso->format('Y-m-d'),
                    'fecha_vencimiento' => $lote->fecha_vencimiento ? $lote->fecha_vencimiento->format('Y-m-d') : null,
                    'cantidad_inicial' => $lote->cantidad_inicial,
                    'cantidad_disponible' => $lote->cantidad_disponible,
                    'costo_unitario' => $lote->costo_unitario,
                    'esta_vencido' => $lote->fecha_vencimiento ? $lote->fecha_vencimiento->isPast() : false,
                    'proximo_vencer' => $lote->fecha_vencimiento ? $lote->fecha_vencimiento->diffInDays(now()) <= 30 : false,
                ];
            });

        return response()->json([
            'producto' => [
                'producto_id' => $producto->producto_id,
                'codigo_principal' => $producto->codigo_principal,
                'codigo_barras' => $producto->codigo_barras,
                'nombre' => $producto->nombre,
                'categoria' => $producto->categoria->nombre ?? 'Sin categoría',
                'stock_actual' => $producto->stock_actual,
                'precio_costo' => $producto->precio_costo,
                'precio_unitario' => $producto->precio_unitario,
            ],
            'kardex' => $kardex,
            'lotes' => $lotes,
            'resumen' => [
                'total_entradas' => collect($kardex)->sum('entrada'),
                'total_salidas' => collect($kardex)->sum('salida'),
                'saldo_final' => $saldo,
                'total_movimientos' => count($kardex),
            ],
        ]);
    }

    /**
     * Estadísticas generales del inventario
     */
    public function estadisticas()
    {
        // Total de productos
        $totalProductos = Producto::where('estado', 'activo')->count();
        
        // Productos con stock bajo
        $stockBajo = Producto::where('estado', 'activo')
            ->whereColumn('stock_actual', '<=', 'stock_minimo')
            ->count();
        
        // Productos sin stock
        $sinStock = Producto::where('estado', 'activo')
            ->where('stock_actual', '<=', 0)
            ->count();
        
        // Valor total del inventario
        $valorInventario = Producto::where('estado', 'activo')
            ->selectRaw('SUM(stock_actual * COALESCE(precio_costo, precio_unitario)) as valor')
            ->first()->valor ?? 0;

        // Movimientos del mes actual
        $inicioMes = now()->startOfMonth();
        $finMes = now()->endOfMonth();

        $movimientosMes = MovimientoInventario::whereBetween('created_at', [$inicioMes, $finMes])->get();
        
        $entradasMes = $movimientosMes->sum('cantidad_entrada');
        $salidasMes = $movimientosMes->sum('cantidad_salida');

        // Productos más movidos (últimos 30 días)
        $productosMasMovidos = MovimientoInventario::select(
                'producto_id',
                DB::raw('COUNT(*) as total_movimientos'),
                DB::raw('SUM(cantidad_entrada) as total_entradas'),
                DB::raw('SUM(cantidad_salida) as total_salidas')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('producto_id')
            ->orderByDesc('total_movimientos')
            ->limit(10)
            ->with('producto:producto_id,nombre,codigo_principal')
            ->get();

        // Productos con stock crítico (menor o igual a 5)
        $productosCriticos = Producto::where('estado', 'activo')
            ->where('stock_actual', '<=', 5)
            ->orderBy('stock_actual')
            ->limit(10)
            ->get(['producto_id', 'codigo_principal', 'nombre', 'stock_actual', 'stock_minimo']);

        // Lotes próximos a vencer (30 días)
        $lotesProximosVencer = Lote::where('cantidad_disponible', '>', 0)
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<=', now()->addDays(30))
            ->where('fecha_vencimiento', '>', now())
            ->with('producto:producto_id,nombre,codigo_principal')
            ->orderBy('fecha_vencimiento')
            ->limit(10)
            ->get();

        // Lotes vencidos
        $lotesVencidos = Lote::where('cantidad_disponible', '>', 0)
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<', now())
            ->count();

        return response()->json([
            'resumen' => [
                'total_productos' => $totalProductos,
                'productos_stock_bajo' => $stockBajo,
                'productos_sin_stock' => $sinStock,
                'valor_inventario' => round($valorInventario, 2),
                'lotes_vencidos' => $lotesVencidos,
            ],
            'movimientos_mes' => [
                'entradas' => $entradasMes,
                'salidas' => $salidasMes,
                'total' => $movimientosMes->count(),
            ],
            'productos_mas_movidos' => $productosMasMovidos,
            'productos_criticos' => $productosCriticos,
            'lotes_proximos_vencer' => $lotesProximosVencer,
        ]);
    }

    /**
     * Registrar un ajuste de inventario manual
     */
    public function ajusteInventario(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|exists:productos,producto_id',
            'tipo_ajuste' => 'required|in:entrada,salida',
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'required|string|max:255',
            'observaciones' => 'nullable|string|max:1000',
        ]);

        DB::beginTransaction();

        try {
            $producto = Producto::findOrFail($request->producto_id);
            $usuario = $request->user();

            $cantidadEntrada = $request->tipo_ajuste === 'entrada' ? $request->cantidad : 0;
            $cantidadSalida = $request->tipo_ajuste === 'salida' ? $request->cantidad : 0;

            // Validar que hay suficiente stock para salida
            if ($request->tipo_ajuste === 'salida' && $producto->stock_actual < $request->cantidad) {
                return response()->json([
                    'message' => 'Stock insuficiente para realizar el ajuste',
                    'stock_actual' => $producto->stock_actual,
                ], 400);
            }

            // Actualizar stock
            if ($request->tipo_ajuste === 'entrada') {
                $producto->stock_actual += $request->cantidad;
            } else {
                $producto->stock_actual -= $request->cantidad;
            }
            $producto->save();

            // Registrar movimiento en kardex
            $movimiento = MovimientoInventario::create([
                'producto_id' => $producto->producto_id,
                'fecha' => now(),
                'tipo_movimiento' => strtoupper($request->tipo_ajuste),
                'tipo_documento' => 'AJUSTE',
                'numero_documento' => 'AJ-' . now()->format('YmdHis'),
                'cantidad' => $request->cantidad,
                'cantidad_entrada' => $cantidadEntrada,
                'cantidad_salida' => $cantidadSalida,
                'stock_resultante' => $producto->stock_actual,
                'costo_unitario' => $producto->precio_costo ?? 0,
                'referencia' => $request->motivo,
                'observaciones' => $request->observaciones,
                'usuario_id' => $usuario ? $usuario->usuario_id : null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Ajuste de inventario registrado correctamente',
                'movimiento' => $movimiento,
                'stock_actual' => $producto->stock_actual,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al registrar el ajuste',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ingreso de Stock con cálculo de costo promedio y actualización de precio
     */
    public function ingresoStock(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|exists:productos,producto_id',
            'cantidad' => 'required|integer|min:1',
            'costo_unitario' => 'required|numeric|min:0',
            'numero_lote' => 'nullable|string|max:50',
            'fecha_vencimiento' => 'nullable|date|after_or_equal:today',
            'aplicar_nuevo_precio' => 'nullable|boolean',
            'costo_promedio_nuevo' => 'nullable|numeric|min:0',
            'precio_sugerido_nuevo' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            $producto = Producto::findOrFail($request->producto_id);
            $usuario = $request->user();
            $cantidad = (int) $request->cantidad;
            $costoUnitario = (float) $request->costo_unitario;

            // ========== CALCULAR COSTO PROMEDIO PONDERADO ==========
            $stockActual = $producto->stock_actual;
            $costoPromedioActual = (float) ($producto->costo_promedio ?? $producto->precio_costo ?? 0);
            
            $valorInventarioActual = $stockActual * $costoPromedioActual;
            $valorNuevoIngreso = $cantidad * $costoUnitario;
            $stockTotal = $stockActual + $cantidad;
            
            $costoPromedioNuevo = $stockTotal > 0 
                ? ($valorInventarioActual + $valorNuevoIngreso) / $stockTotal 
                : $costoUnitario;

            // ========== CREAR LOTE ==========
            $numeroLote = $request->numero_lote ?: Lote::generarNumeroLote($producto->producto_id);
            
            $lote = Lote::create([
                'producto_id' => $producto->producto_id,
                'numero_lote' => $numeroLote,
                'cantidad_inicial' => $cantidad,
                'cantidad_disponible' => $cantidad,
                'costo_unitario' => $costoUnitario,
                'fecha_ingreso' => now()->toDateString(),
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'estado' => 'activo',
                'compra_id' => null,
            ]);

            // ========== ACTUALIZAR PRODUCTO ==========
            $producto->stock_actual = $stockTotal;
            $producto->costo_promedio = $costoPromedioNuevo;
            $producto->precio_costo = $costoUnitario; // Último costo de compra

            // Si modo automático y se eligió aplicar nuevo precio
            if ($producto->modo_precio === 'automatico' && $request->aplicar_nuevo_precio) {
                $margen = (float) ($producto->margen_ganancia ?? 30);
                $nuevoPrecio = $costoPromedioNuevo * (1 + $margen / 100);
                $producto->precio_unitario = round($nuevoPrecio, 2);
                
                // Recalcular precio con impuestos
                $ivaPorcentaje = $producto->iva_aplica ? ($producto->iva_porcentaje ?? 15) : 0;
                $icePorcentaje = $producto->ice_aplica ? ($producto->ice_porcentaje ?? 0) : 0;
                $producto->precio_con_impuestos = round($producto->precio_unitario * (1 + ($ivaPorcentaje + $icePorcentaje) / 100), 2);
            }

            $producto->save();

            // ========== REGISTRAR MOVIMIENTO ==========
            $movimiento = MovimientoInventario::create([
                'producto_id' => $producto->producto_id,
                'lote_id' => $lote->lote_id,
                'fecha' => now(),
                'tipo_movimiento' => 'ENTRADA',
                'tipo_documento' => 'INGRESO_STOCK',
                'numero_documento' => 'ING-' . now()->format('YmdHis'),
                'cantidad' => $cantidad,
                'cantidad_entrada' => $cantidad,
                'cantidad_salida' => 0,
                'stock_resultante' => $stockTotal,
                'costo_unitario' => $costoUnitario,
                'referencia' => 'Ingreso de stock - Lote: ' . $numeroLote,
                'observaciones' => $request->aplicar_nuevo_precio 
                    ? 'Precio actualizado automáticamente a $' . number_format($producto->precio_unitario, 2)
                    : 'Precio mantiene valor anterior',
                'usuario_id' => $usuario?->usuario_id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ingreso de stock registrado correctamente',
                'data' => [
                    'lote' => $lote,
                    'movimiento' => $movimiento,
                    'producto' => [
                        'producto_id' => $producto->producto_id,
                        'nombre' => $producto->nombre,
                        'stock_actual' => $producto->stock_actual,
                        'costo_promedio' => $producto->costo_promedio,
                        'precio_unitario' => $producto->precio_unitario,
                        'precio_con_impuestos' => $producto->precio_con_impuestos,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el ingreso de stock',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener historial de movimientos filtrado
     */
    public function movimientos(Request $request)
    {
        $query = MovimientoInventario::with(['producto', 'lote', 'usuario']);

        // Filtro por producto
        if ($request->filled('producto_id')) {
            $query->where('producto_id', $request->producto_id);
        }

        // Filtro por tipo de movimiento
        if ($request->filled('tipo_movimiento')) {
            $query->where('tipo_movimiento', $request->tipo_movimiento);
        }

        // Filtro por tipo de documento
        if ($request->filled('tipo_documento')) {
            $query->where('tipo_documento', $request->tipo_documento);
        }

        // Filtro por rango de fechas
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('created_at', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('created_at', '<=', $request->fecha_fin);
        }

        $movimientos = $query->orderBy('created_at', 'desc')->limit(500)->get();

        return response()->json([
            'movimientos' => $movimientos,
            'total' => $movimientos->count(),
            'resumen' => [
                'total_entradas' => $movimientos->sum('cantidad_entrada'),
                'total_salidas' => $movimientos->sum('cantidad_salida'),
            ],
        ]);
    }

    /**
     * Exportar kardex de un producto para impresión
     */
    public function exportar($productoId, Request $request)
    {
        $producto = Producto::with('categoria')->findOrFail($productoId);

        $query = MovimientoInventario::where('producto_id', $productoId);

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('created_at', '>=', $request->fecha_inicio);
        }
        if ($request->filled('fecha_fin')) {
            $query->whereDate('created_at', '<=', $request->fecha_fin);
        }

        $movimientos = $query->orderBy('created_at', 'asc')->get();

        // Calcular saldo acumulado
        $saldo = 0;
        $kardex = [];

        foreach ($movimientos as $mov) {
            $entrada = $mov->cantidad_entrada ?? 0;
            $salida = $mov->cantidad_salida ?? 0;
            $saldo += $entrada - $salida;

            $kardex[] = [
                'fecha' => $mov->created_at->format('d/m/Y'),
                'documento' => $mov->tipo_documento . ($mov->numero_documento ? ' #' . $mov->numero_documento : ''),
                'referencia' => $mov->referencia ?? '-',
                'entrada' => $entrada ?: '-',
                'salida' => $salida ?: '-',
                'saldo' => $saldo,
                'costo' => $mov->costo_unitario ?? '-',
            ];
        }

        return response()->json([
            'titulo' => 'KARDEX DE PRODUCTO',
            'fecha_generacion' => now()->format('d/m/Y H:i'),
            'producto' => [
                'codigo' => $producto->codigo_principal,
                'nombre' => $producto->nombre,
                'categoria' => $producto->categoria->nombre ?? 'Sin categoría',
            ],
            'periodo' => [
                'desde' => $request->fecha_inicio ?? 'Inicio',
                'hasta' => $request->fecha_fin ?? now()->format('Y-m-d'),
            ],
            'movimientos' => $kardex,
            'totales' => [
                'entradas' => collect($kardex)->sum(fn($k) => is_numeric($k['entrada']) ? $k['entrada'] : 0),
                'salidas' => collect($kardex)->sum(fn($k) => is_numeric($k['salida']) ? $k['salida'] : 0),
                'saldo_final' => $saldo,
            ],
        ]);
    }

    /**
     * Obtener lotes de un producto
     */
    public function lotes($productoId)
    {
        $producto = Producto::findOrFail($productoId);

        $lotes = Lote::where('producto_id', $productoId)
            ->orderBy('fecha_ingreso', 'asc')
            ->get()
            ->map(function ($lote) {
                $diasParaVencer = null;
                $estado = 'disponible';

                if ($lote->fecha_vencimiento) {
                    $diasParaVencer = now()->diffInDays($lote->fecha_vencimiento, false);
                    if ($diasParaVencer < 0) {
                        $estado = 'vencido';
                    } elseif ($diasParaVencer <= 30) {
                        $estado = 'proximo_vencer';
                    }
                }

                if ($lote->cantidad_disponible <= 0) {
                    $estado = 'agotado';
                }

                return [
                    'lote_id' => $lote->lote_id,
                    'fecha_ingreso' => $lote->fecha_ingreso->format('Y-m-d'),
                    'fecha_vencimiento' => $lote->fecha_vencimiento ? $lote->fecha_vencimiento->format('Y-m-d') : null,
                    'cantidad_inicial' => $lote->cantidad_inicial,
                    'cantidad_disponible' => $lote->cantidad_disponible,
                    'costo_unitario' => $lote->costo_unitario,
                    'dias_para_vencer' => $diasParaVencer,
                    'estado' => $estado,
                ];
            });

        return response()->json([
            'producto' => [
                'producto_id' => $producto->producto_id,
                'nombre' => $producto->nombre,
            ],
            'lotes' => $lotes,
            'total_lotes' => $lotes->count(),
            'lotes_activos' => $lotes->where('estado', 'disponible')->count(),
        ]);
    }
}
