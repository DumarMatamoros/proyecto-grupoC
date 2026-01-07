<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Factura;
use App\Models\DetalleFactura;
use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Configuracion;
use App\Models\MovimientoInventario;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FacturaController extends Controller
{
    /**
     * Listar facturas con filtros
     */
    public function index(Request $request)
    {
        $query = Factura::with(['cliente', 'detalles.producto', 'sucursal', 'usuario']);

        // Filtrar por sucursal
        if ($request->filled('sucursal_id')) {
            $query->where('sucursal_id', $request->sucursal_id);
        }

        // Filtrar por cliente
        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        // Filtrar por estado
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        // Filtrar por fechas
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
        }

        // Búsqueda general
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_factura', 'like', "%{$search}%")
                  ->orWhere('cedula_cliente', 'like', "%{$search}%")
                  ->orWhere('nombre_cliente', 'like', "%{$search}%");
            });
        }

        // Ordenar por fecha descendente
        $facturas = $query->orderBy('fecha_emision', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($facturas);
    }

    /**
     * Obtener estadísticas de facturación
     */
    public function estadisticas()
    {
        $hoy = Carbon::today();
        $inicioMes = Carbon::now()->startOfMonth();
        $finMes = Carbon::now()->endOfMonth();

        // Ventas del día
        $ventasHoy = Factura::whereDate('fecha_emision', $hoy)
            ->whereIn('estado', ['emitida', 'pagada'])
            ->sum('total');

        $facturasHoy = Factura::whereDate('fecha_emision', $hoy)
            ->whereIn('estado', ['emitida', 'pagada'])
            ->count();

        // Ventas del mes
        $ventasMes = Factura::whereBetween('fecha_emision', [$inicioMes, $finMes])
            ->whereIn('estado', ['emitida', 'pagada'])
            ->sum('total');

        $facturasMes = Factura::whereBetween('fecha_emision', [$inicioMes, $finMes])
            ->whereIn('estado', ['emitida', 'pagada'])
            ->count();

        // IVA recaudado del mes
        $ivaMes = Factura::whereBetween('fecha_emision', [$inicioMes, $finMes])
            ->whereIn('estado', ['emitida', 'pagada'])
            ->sum('total_iva');

        // Facturas pendientes
        $facturasPendientes = Factura::where('estado', 'pendiente')->count();

        // Productos más vendidos (este mes)
        $productosMasVendidos = DetalleFactura::whereHas('factura', function ($q) use ($inicioMes, $finMes) {
                $q->whereBetween('fecha_emision', [$inicioMes, $finMes])
                  ->whereIn('estado', ['emitida', 'pagada']);
            })
            ->select('producto_id', DB::raw('SUM(cantidad) as total_cantidad'), DB::raw('SUM(total_detalle) as total_ventas'))
            ->groupBy('producto_id')
            ->orderByDesc('total_cantidad')
            ->limit(5)
            ->with('producto:producto_id,nombre,codigo_principal')
            ->get();

        // Ventas por forma de pago (este mes)
        $ventasPorFormaPago = Factura::whereBetween('fecha_emision', [$inicioMes, $finMes])
            ->whereIn('estado', ['emitida', 'pagada'])
            ->select('forma_pago', DB::raw('COUNT(*) as cantidad'), DB::raw('SUM(total) as total'))
            ->groupBy('forma_pago')
            ->get();

        return response()->json([
            'ventas_hoy' => (float) $ventasHoy,
            'facturas_hoy' => $facturasHoy,
            'ventas_mes' => (float) $ventasMes,
            'facturas_mes' => $facturasMes,
            'iva_recaudado_mes' => (float) $ivaMes,
            'facturas_pendientes' => $facturasPendientes,
            'productos_mas_vendidos' => $productosMasVendidos,
            'ventas_por_forma_pago' => $ventasPorFormaPago,
            'formas_pago' => Factura::FORMAS_PAGO,
            'estados' => Factura::ESTADOS,
        ]);
    }

    /**
     * Crear nueva factura
     */
    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'nullable|exists:clientes,cliente_id',
            'cedula_cliente' => 'required|string|max:13',
            'nombre_cliente' => 'required|string|max:255',
            'direccion_cliente' => 'nullable|string|max:500',
            'telefono_cliente' => 'nullable|string|max:15',
            'email_cliente' => 'nullable|email|max:255',
            'sucursal_id' => 'nullable|integer',
            'forma_pago' => 'required|in:efectivo,tarjeta,transferencia,cheque,credito',
            'observaciones' => 'nullable|string|max:1000',
            'descuento' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,producto_id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0.01',
            'items.*.descuento' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            $usuario = $request->user();
            $porcentajeIva = Configuracion::obtener('iva_porcentaje', 15);
            
            // Determinar si es consumidor final
            $esConsumidorFinal = $request->cedula_cliente === '9999999999999' || 
                                 $request->cedula_cliente === '9999999999';

            // Generar número de factura
            $sucursalId = $request->sucursal_id ?? 1;
            $numeroFactura = $this->generarNumeroFactura($sucursalId);
            
            // Generar clave de acceso
            $fechaEmision = now()->format('Y-m-d');
            $rucEmpresa = Configuracion::obtener('ruc_empresa', '9999999999001');
            $codigoNumerico = str_pad(rand(0, 99999999), 8, '0', STR_PAD_LEFT);
            
            $claveAcceso = Factura::generarClaveAcceso(
                $fechaEmision,
                '01', // Tipo comprobante: Factura
                $rucEmpresa,
                '1', // Ambiente: 1 = Pruebas, 2 = Producción
                str_pad($sucursalId, 3, '0', STR_PAD_LEFT) . '001',
                $this->obtenerSecuencial($sucursalId),
                $codigoNumerico,
                '1' // Tipo emisión: Normal
            );

            // Crear factura
            $factura = Factura::create([
                'clave_acceso' => $claveAcceso,
                'numero_factura' => $numeroFactura,
                'numero_establecimiento' => str_pad($sucursalId, 3, '0', STR_PAD_LEFT),
                'punto_emision' => '001',
                'fecha_emision' => $fechaEmision,
                'hora' => now()->format('H:i:s'),
                'total_sin_impuestos' => 0,
                'descuento' => $request->descuento ?? 0,
                'total_iva' => 0,
                'total' => 0,
                'estado' => 'emitida',
                'cliente_id' => $esConsumidorFinal ? null : $request->cliente_id,
                'cedula_cliente' => $request->cedula_cliente,
                'nombre_cliente' => $esConsumidorFinal ? 'CONSUMIDOR FINAL' : $request->nombre_cliente,
                'direccion_cliente' => $request->direccion_cliente,
                'telefono_cliente' => $request->telefono_cliente,
                'email_cliente' => $request->email_cliente,
                'forma_pago' => $request->forma_pago,
                'observaciones' => $request->observaciones,
                'sucursal_id' => $sucursalId,
                'usuario_id' => $usuario ? $usuario->usuario_id : null,
            ]);

            $subtotal = 0;
            $totalIva = 0;

            foreach ($request->items as $item) {
                $producto = Producto::findOrFail($item['producto_id']);
                
                // Verificar stock
                if ($producto->stock_actual < $item['cantidad']) {
                    throw new \Exception("Stock insuficiente para el producto: {$producto->nombre}. Disponible: {$producto->stock_actual}");
                }

                $cantidad = $item['cantidad'];
                $precioUnitario = $item['precio_unitario'];
                $descuentoItem = $item['descuento'] ?? 0;
                $subtotalItem = ($cantidad * $precioUnitario) - $descuentoItem;
                
                // Calcular IVA según configuración del producto
                $ivaAplica = $producto->iva_aplica ?? true;
                $ivaItem = $ivaAplica ? ($subtotalItem * $porcentajeIva / 100) : 0;
                $totalItem = $subtotalItem + $ivaItem;

                DetalleFactura::create([
                    'factura_id' => $factura->factura_id,
                    'producto_id' => $producto->producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'iva_aplica' => $ivaAplica,
                    'porcentaje_iva' => $ivaAplica ? $porcentajeIva : 0,
                    'descuento' => $descuentoItem,
                    'subtotal' => $subtotalItem,
                    'iva' => $ivaItem,
                    'total_detalle' => $totalItem,
                ]);

                // ========== DESCUENTO FIFO DEL STOCK ==========
                $cantidadRestante = $cantidad;
                
                // Obtener lotes ordenados por FIFO (primero los más antiguos y próximos a vencer)
                $lotes = Lote::where('producto_id', $producto->producto_id)
                    ->where('cantidad_disponible', '>', 0)
                    ->orderBy('fecha_vencimiento', 'asc')
                    ->orderBy('fecha_ingreso', 'asc')
                    ->get();

                foreach ($lotes as $lote) {
                    if ($cantidadRestante <= 0) break;

                    // Cantidad a descontar de este lote
                    $cantidadDescontarLote = min($lote->cantidad_disponible, $cantidadRestante);
                    
                    // Actualizar lote
                    $lote->cantidad_disponible -= $cantidadDescontarLote;
                    $lote->save();

                    // Registrar movimiento de inventario para este lote
                    MovimientoInventario::create([
                        'fecha' => $fechaEmision,
                        'tipo_movimiento' => 'SALIDA',
                        'tipo_documento' => 'FACTURA',
                        'numero_documento' => $factura->factura_id,
                        'cantidad' => $cantidadDescontarLote,
                        'cantidad_entrada' => 0,
                        'cantidad_salida' => $cantidadDescontarLote,
                        'stock_resultante' => $producto->stock_actual - $cantidadDescontarLote,
                        'costo_unitario' => $lote->costo_unitario,
                        'lote_id' => $lote->lote_id,
                        'referencia' => "Factura #{$numeroFactura}",
                        'producto_id' => $producto->producto_id,
                        'usuario_id' => $usuario ? $usuario->usuario_id : null,
                        'observaciones' => "Lote: {$lote->lote_id}, Cliente: {$request->nombre_cliente}",
                    ]);

                    $cantidadRestante -= $cantidadDescontarLote;

                    // Actualizar stock del producto
                    $producto->stock_actual -= $cantidadDescontarLote;
                    $producto->save();
                }

                // Si no hay lotes suficientes pero hay stock (productos sin lote), registrar salida general
                if ($cantidadRestante > 0) {
                    $producto->stock_actual -= $cantidadRestante;
                    $producto->save();

                    MovimientoInventario::create([
                        'fecha' => $fechaEmision,
                        'tipo_movimiento' => 'SALIDA',
                        'tipo_documento' => 'FACTURA',
                        'numero_documento' => $factura->factura_id,
                        'cantidad' => $cantidadRestante,
                        'cantidad_entrada' => 0,
                        'cantidad_salida' => $cantidadRestante,
                        'stock_resultante' => $producto->stock_actual,
                        'costo_unitario' => $producto->precio_costo,
                        'lote_id' => null,
                        'referencia' => "Factura #{$numeroFactura} (sin lote)",
                        'producto_id' => $producto->producto_id,
                        'usuario_id' => $usuario ? $usuario->usuario_id : null,
                        'observaciones' => "Producto sin lote asignado",
                    ]);
                }

                $subtotal += $subtotalItem;
                $totalIva += $ivaItem;
            }

            // Actualizar totales
            $descuentoGeneral = $request->descuento ?? 0;
            $total = $subtotal + $totalIva - $descuentoGeneral;

            $factura->update([
                'total_sin_impuestos' => $subtotal,
                'total_iva' => $totalIva,
                'total' => $total,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Factura creada exitosamente',
                'factura' => $factura->load(['cliente', 'detalles.producto', 'sucursal', 'usuario']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear la factura',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mostrar una factura específica
     */
    public function show(string $id)
    {
        $factura = Factura::with(['cliente', 'detalles.producto', 'sucursal', 'usuario', 'pagos'])
            ->findOrFail($id);

        return response()->json($factura);
    }

    /**
     * Actualizar estado de factura
     */
    public function update(Request $request, string $id)
    {
        $factura = Factura::findOrFail($id);

        $validated = $request->validate([
            'estado' => 'sometimes|in:pendiente,emitida,pagada,anulada',
            'observaciones' => 'sometimes|nullable|string|max:1000',
        ]);

        // Si se anula, revertir stock
        if (isset($validated['estado']) && $validated['estado'] === 'anulada' && $factura->estado !== 'anulada') {
            DB::beginTransaction();
            try {
                $usuario = $request->user();
                
                foreach ($factura->detalles as $detalle) {
                    $producto = Producto::find($detalle->producto_id);
                    if ($producto) {
                        $producto->stock_actual += $detalle->cantidad;
                        $producto->save();
                    }

                    // Registrar movimiento de inventario KARDEX
                    MovimientoInventario::create([
                        'fecha' => now()->format('Y-m-d'),
                        'tipo_movimiento' => 'ENTRADA',
                        'tipo_documento' => 'ANULACION_FACTURA',
                        'numero_documento' => $factura->factura_id,
                        'cantidad' => $detalle->cantidad,
                        'cantidad_entrada' => $detalle->cantidad,
                        'cantidad_salida' => 0,
                        'stock_resultante' => $producto->stock_actual,
                        'costo_unitario' => $producto->precio_costo,
                        'referencia' => "Anulación Factura #{$factura->numero_factura}",
                        'producto_id' => $detalle->producto_id,
                        'usuario_id' => $usuario ? $usuario->usuario_id : null,
                        'observaciones' => 'Stock revertido por anulación de factura',
                    ]);
                }

                $factura->update($validated);
                DB::commit();

            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Error al anular la factura',
                    'error' => $e->getMessage(),
                ], 422);
            }
        } else {
            $factura->update($validated);
        }

        return response()->json([
            'message' => 'Factura actualizada exitosamente',
            'factura' => $factura->load(['cliente', 'detalles.producto', 'sucursal']),
        ]);
    }

    /**
     * Eliminar una factura (solo si está pendiente)
     */
    public function destroy(string $id)
    {
        $factura = Factura::with('detalles')->findOrFail($id);

        if ($factura->estado !== 'pendiente') {
            return response()->json([
                'message' => 'Solo se pueden eliminar facturas en estado pendiente',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Revertir stock
            foreach ($factura->detalles as $detalle) {
                $producto = Producto::find($detalle->producto_id);
                if ($producto) {
                    $producto->stock_actual += $detalle->cantidad;
                    $producto->save();
                }
            }

            // Eliminar movimientos de inventario relacionados
            MovimientoInventario::where('referencia', 'like', "Factura #{$factura->numero_factura}%")->delete();

            $factura->detalles()->delete();
            $factura->delete();

            DB::commit();

            return response()->json([
                'message' => 'Factura eliminada exitosamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar la factura',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Buscar clientes
     */
    public function buscarClientes(Request $request)
    {
        $search = $request->get('q', '');
        
        $clientes = Cliente::with('usuario')
            ->where(function ($q) use ($search) {
                $q->where('ruc_cedula', 'like', "%{$search}%")
                  ->orWhere('razon_social', 'like', "%{$search}%")
                  ->orWhereHas('usuario', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            })
            ->limit(10)
            ->get();

        return response()->json($clientes);
    }

    /**
     * Generar número de factura único
     */
    private function generarNumeroFactura($sucursalId): string
    {
        $ultimaFactura = Factura::where('sucursal_id', $sucursalId)
            ->orderBy('created_at', 'desc')
            ->first();

        $secuencial = 1;
        if ($ultimaFactura && $ultimaFactura->numero_factura) {
            $partes = explode('-', $ultimaFactura->numero_factura);
            if (count($partes) === 3) {
                $secuencial = intval($partes[2]) + 1;
            }
        }

        return sprintf('%03d-%03d-%09d', $sucursalId, 1, $secuencial);
    }

    /**
     * Obtener secuencial para clave de acceso
     */
    private function obtenerSecuencial($sucursalId): string
    {
        $ultimaFactura = Factura::where('sucursal_id', $sucursalId)
            ->orderBy('created_at', 'desc')
            ->first();

        $secuencial = 1;
        if ($ultimaFactura && $ultimaFactura->numero_factura) {
            $partes = explode('-', $ultimaFactura->numero_factura);
            if (count($partes) === 3) {
                $secuencial = intval($partes[2]) + 1;
            }
        }

        return str_pad($secuencial, 9, '0', STR_PAD_LEFT);
    }
}
