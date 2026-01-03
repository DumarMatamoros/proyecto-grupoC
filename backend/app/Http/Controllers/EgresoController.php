<?php

namespace App\Http\Controllers;

use App\Models\Egreso;
use App\Models\DetalleEgreso;
use App\Models\Producto;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EgresoController extends Controller
{
    /**
     * Listar todos los egresos con sus detalles
     */
    public function index(Request $request)
    {
        $query = Egreso::with(['detalles.producto', 'usuario', 'sucursal'])
            ->orderBy('fecha', 'desc')
            ->orderBy('created_at', 'desc');

        // Filtro por motivo
        if ($request->has('motivo') && $request->motivo) {
            $query->where('motivo', $request->motivo);
        }

        // Filtro por fechas
        if ($request->has('fecha_inicio') && $request->fecha_inicio) {
            $query->whereDate('fecha', '>=', $request->fecha_inicio);
        }

        if ($request->has('fecha_fin') && $request->fecha_fin) {
            $query->whereDate('fecha', '<=', $request->fecha_fin);
        }

        // Búsqueda general
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('observaciones', 'like', "%{$search}%")
                  ->orWhereHas('detalles.producto', function ($q2) use ($search) {
                      $q2->where('nombre', 'like', "%{$search}%")
                         ->orWhere('codigo_principal', 'like', "%{$search}%");
                  });
            });
        }

        $egresos = $query->get();

        return response()->json($egresos);
    }

    /**
     * Obtener estadísticas de egresos
     */
    public function estadisticas()
    {
        $hoy = Carbon::today();
        $inicioMes = Carbon::now()->startOfMonth();
        $finMes = Carbon::now()->endOfMonth();

        // Total de egresos del mes
        $totalMes = Egreso::whereBetween('fecha', [$inicioMes, $finMes])->count();

        // Unidades perdidas este mes
        $unidadesMes = Egreso::whereBetween('fecha', [$inicioMes, $finMes])->sum('total_unidades');

        // Valor total perdido este mes
        $valorMes = Egreso::whereBetween('fecha', [$inicioMes, $finMes])->sum('valor_total');

        // Egresos por motivo (este mes)
        $porMotivo = Egreso::whereBetween('fecha', [$inicioMes, $finMes])
            ->select('motivo', DB::raw('COUNT(*) as cantidad'), DB::raw('SUM(total_unidades) as unidades'), DB::raw('SUM(valor_total) as valor'))
            ->groupBy('motivo')
            ->get()
            ->keyBy('motivo');

        // Productos más afectados (este mes)
        $productosAfectados = DetalleEgreso::whereHas('egreso', function ($q) use ($inicioMes, $finMes) {
                $q->whereBetween('fecha', [$inicioMes, $finMes]);
            })
            ->select('producto_id', DB::raw('SUM(cantidad) as total_cantidad'), DB::raw('SUM(subtotal) as total_valor'))
            ->groupBy('producto_id')
            ->orderByDesc('total_cantidad')
            ->limit(5)
            ->with('producto:producto_id,nombre,codigo_principal')
            ->get();

        // Egresos de hoy
        $egresosHoy = Egreso::whereDate('fecha', $hoy)->count();

        // Tendencia últimos 7 días
        $tendencia = [];
        for ($i = 6; $i >= 0; $i--) {
            $fecha = Carbon::today()->subDays($i);
            $cantidad = Egreso::whereDate('fecha', $fecha)->sum('total_unidades');
            $tendencia[] = [
                'fecha' => $fecha->format('Y-m-d'),
                'dia' => $fecha->format('D'),
                'cantidad' => (int) $cantidad,
            ];
        }

        return response()->json([
            'total_egresos_mes' => $totalMes,
            'unidades_perdidas_mes' => (int) $unidadesMes,
            'valor_perdido_mes' => (float) $valorMes,
            'egresos_hoy' => $egresosHoy,
            'por_motivo' => $porMotivo,
            'productos_afectados' => $productosAfectados,
            'tendencia_semanal' => $tendencia,
            'motivos_disponibles' => Egreso::MOTIVOS,
        ]);
    }

    /**
     * Crear un nuevo egreso
     */
    public function store(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date',
            'motivo' => 'required|in:desecho,vencido,dañado,perdida,ajuste,otro',
            'observaciones' => 'nullable|string|max:1000',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,producto_id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.motivo_detalle' => 'nullable|string|max:255',
            'detalles.*.fecha_vencimiento' => 'nullable|date',
        ]);

        DB::beginTransaction();

        try {
            // Crear el egreso
            $egreso = Egreso::create([
                'fecha' => $request->fecha,
                'motivo' => $request->motivo,
                'observaciones' => $request->observaciones,
                'usuario_id' => $request->user() ? $request->user()->usuario_id : null,
                'sucursal_id' => $request->sucursal_id,
                'total_unidades' => 0,
                'valor_total' => 0,
            ]);

            $totalUnidades = 0;
            $valorTotal = 0;

            foreach ($request->detalles as $detalle) {
                $producto = Producto::findOrFail($detalle['producto_id']);

                // Verificar que haya suficiente stock
                if ($producto->stock_actual < $detalle['cantidad']) {
                    throw new \Exception("Stock insuficiente para el producto: {$producto->nombre}. Stock actual: {$producto->stock_actual}");
                }

                $precioUnitario = $producto->precio_costo ?? $producto->precio_unitario ?? 0;
                $subtotal = $detalle['cantidad'] * $precioUnitario;

                // Crear detalle de egreso
                DetalleEgreso::create([
                    'egreso_id' => $egreso->egreso_id,
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotal,
                    'motivo_detalle' => $detalle['motivo_detalle'] ?? null,
                    'fecha_vencimiento' => $detalle['fecha_vencimiento'] ?? null,
                ]);

                // Actualizar stock del producto
                $producto->stock_actual -= $detalle['cantidad'];
                $producto->save();

                // Registrar movimiento de inventario
                MovimientoInventario::create([
                    'fecha' => $request->fecha,
                    'tipo_movimiento' => 'salida',
                    'cantidad' => $detalle['cantidad'],
                    'referencia' => "Egreso #{$egreso->egreso_id} - " . Egreso::MOTIVOS[$request->motivo],
                    'producto_id' => $detalle['producto_id'],
                ]);

                $totalUnidades += $detalle['cantidad'];
                $valorTotal += $subtotal;
            }

            // Actualizar totales del egreso
            $egreso->update([
                'total_unidades' => $totalUnidades,
                'valor_total' => $valorTotal,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Egreso registrado correctamente',
                'egreso' => $egreso->load(['detalles.producto', 'usuario']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al registrar el egreso',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Mostrar un egreso específico
     */
    public function show($id)
    {
        $egreso = Egreso::with(['detalles.producto', 'usuario', 'sucursal'])
            ->findOrFail($id);

        return response()->json($egreso);
    }

    /**
     * Eliminar un egreso (revertir stock)
     */
    public function destroy($id)
    {
        $egreso = Egreso::with('detalles')->findOrFail($id);

        DB::beginTransaction();

        try {
            // Revertir el stock de cada producto
            foreach ($egreso->detalles as $detalle) {
                $producto = Producto::find($detalle->producto_id);
                if ($producto) {
                    $producto->stock_actual += $detalle->cantidad;
                    $producto->save();
                }

                // Eliminar el movimiento de inventario relacionado
                MovimientoInventario::where('producto_id', $detalle->producto_id)
                    ->where('referencia', 'like', "Egreso #{$egreso->egreso_id}%")
                    ->where('tipo_movimiento', 'salida')
                    ->delete();
            }

            // Eliminar el egreso (los detalles se eliminan en cascada)
            $egreso->delete();

            DB::commit();

            return response()->json([
                'message' => 'Egreso eliminado y stock revertido correctamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar el egreso',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Obtener productos con stock bajo o próximos a vencer
     */
    public function productosProblematicos()
    {
        $hoy = Carbon::today();
        $proximoMes = Carbon::today()->addMonth();

        // Productos con stock bajo (menos de 10 unidades)
        $stockBajo = Producto::where('stock_actual', '>', 0)
            ->where('stock_actual', '<=', 10)
            ->select('producto_id', 'nombre', 'codigo_principal', 'stock_actual', 'precio_costo')
            ->orderBy('stock_actual', 'asc')
            ->limit(10)
            ->get();

        // Productos sin stock
        $sinStock = Producto::where('stock_actual', '<=', 0)
            ->select('producto_id', 'nombre', 'codigo_principal', 'stock_actual')
            ->limit(10)
            ->get();

        return response()->json([
            'stock_bajo' => $stockBajo,
            'sin_stock' => $sinStock,
        ]);
    }
}
