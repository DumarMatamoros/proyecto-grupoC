<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    /**
     * Listar todas las compras con sus relaciones
     */
    public function index()
    {
        $compras = Compra::with(['proveedor', 'detalles.producto'])
            ->orderBy('fecha', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Agregar campos calculados
        $compras = $compras->map(function ($compra) {
            $compra->cantidad_productos = $compra->detalles->sum('cantidad');
            $compra->total_items = $compra->detalles->count();
            return $compra;
        });

        return response()->json($compras);
    }

    /**
     * Mostrar una compra específica
     */
    public function show($id)
    {
        $compra = Compra::with(['proveedor', 'detalles.producto'])
            ->findOrFail($id);

        return response()->json($compra);
    }

    /**
     * Crear una nueva compra con sus detalles
     */
    public function store(Request $request)
    {
        $request->validate([
            'proveedor_id' => 'required|exists:proveedores,proveedor_id',
            'numero_factura_proveedor' => 'required|string|max:100',
            'fecha' => 'required|date',
            'detalles' => 'required|array|min:1',
            'detalles.*.producto_id' => 'required|exists:productos,producto_id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.fecha_expiracion' => 'nullable|date',
        ]);

        DB::beginTransaction();

        try {
            // Calcular totales
            $totalCompra = 0;
            $detallesData = [];

            foreach ($request->detalles as $detalle) {
                $producto = Producto::find($detalle['producto_id']);
                $cantidad = (int) $detalle['cantidad'];
                $precioUnitario = (float) $detalle['precio_unitario'];
                $subtotal = $cantidad * $precioUnitario;
                
                // Calcular IVA si el producto aplica
                $ivaRate = $producto->iva_aplica ? 0.15 : 0; // 15% IVA Ecuador
                $iva = $subtotal * $ivaRate;
                $total = $subtotal + $iva;

                $detallesData[] = [
                    'producto_id' => $detalle['producto_id'],
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotal,
                    'iva' => $iva,
                    'total' => $total,
                    'fecha_expiracion' => $detalle['fecha_expiracion'] ?? null,
                ];

                $totalCompra += $total;
            }

            // Crear la compra
            $compra = Compra::create([
                'proveedor_id' => $request->proveedor_id,
                'numero_factura_proveedor' => $request->numero_factura_proveedor,
                'fecha' => $request->fecha,
                'total' => $totalCompra,
            ]);

            // Crear detalles y actualizar stock
            foreach ($detallesData as $detalleData) {
                $detalle = $compra->detalles()->create($detalleData);

                // Actualizar stock del producto
                $producto = Producto::find($detalleData['producto_id']);
                $producto->stock_actual += $detalleData['cantidad'];
                
                // Actualizar precio de costo si se proporciona
                $producto->precio_costo = $detalleData['precio_unitario'];
                $producto->save();

                // Registrar movimiento de inventario
                MovimientoInventario::create([
                    'fecha' => $request->fecha,
                    'tipo_movimiento' => 'entrada',
                    'cantidad' => $detalleData['cantidad'],
                    'referencia' => 'Compra #' . $compra->compra_id . ' - Factura: ' . $request->numero_factura_proveedor,
                    'producto_id' => $detalleData['producto_id'],
                ]);
            }

            DB::commit();

            // Cargar relaciones para la respuesta
            $compra->load(['proveedor', 'detalles.producto']);

            return response()->json([
                'message' => 'Compra registrada correctamente',
                'compra' => $compra,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al registrar la compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar una compra existente
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'proveedor_id' => 'sometimes|exists:proveedores,proveedor_id',
            'numero_factura_proveedor' => 'sometimes|string|max:100',
            'fecha' => 'sometimes|date',
        ]);

        $compra = Compra::findOrFail($id);
        $compra->update($request->only(['proveedor_id', 'numero_factura_proveedor', 'fecha']));

        return response()->json([
            'message' => 'Compra actualizada correctamente',
            'compra' => $compra->load(['proveedor', 'detalles.producto']),
        ]);
    }

    /**
     * Eliminar una compra (y revertir el stock)
     */
    public function destroy($id)
    {
        DB::beginTransaction();

        try {
            $compra = Compra::with('detalles')->findOrFail($id);

            // Revertir el stock de cada producto
            foreach ($compra->detalles as $detalle) {
                $producto = Producto::find($detalle->producto_id);
                if ($producto) {
                    $producto->stock_actual -= $detalle->cantidad;
                    if ($producto->stock_actual < 0) {
                        $producto->stock_actual = 0;
                    }
                    $producto->save();

                    // Registrar movimiento de reversión
                    MovimientoInventario::create([
                        'fecha' => now(),
                        'tipo_movimiento' => 'salida',
                        'cantidad' => $detalle->cantidad,
                        'referencia' => 'Anulación Compra #' . $compra->compra_id,
                        'producto_id' => $detalle->producto_id,
                    ]);
                }
            }

            // Eliminar detalles y compra
            $compra->detalles()->delete();
            $compra->delete();

            DB::commit();

            return response()->json([
                'message' => 'Compra eliminada y stock revertido correctamente',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar la compra',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de compras
     */
    public function estadisticas()
    {
        $mesActual = now()->month;
        $anioActual = now()->year;

        // Total de compras del mes
        $comprasMes = Compra::whereMonth('fecha', $mesActual)
            ->whereYear('fecha', $anioActual)
            ->count();

        // Gasto total del mes
        $gastoMes = Compra::whereMonth('fecha', $mesActual)
            ->whereYear('fecha', $anioActual)
            ->sum('total');

        // Productos recibidos este mes
        $productosRecibidos = DetalleCompra::whereHas('compra', function ($q) use ($mesActual, $anioActual) {
            $q->whereMonth('fecha', $mesActual)->whereYear('fecha', $anioActual);
        })->sum('cantidad');

        // Total histórico
        $totalHistorico = Compra::sum('total');

        return response()->json([
            'compras_mes' => $comprasMes,
            'gasto_mes' => round($gastoMes, 2),
            'productos_recibidos' => $productosRecibidos,
            'total_historico' => round($totalHistorico, 2),
        ]);
    }

    /**
     * Listar proveedores (para el dropdown)
     */
    public function proveedores()
    {
        $proveedores = Proveedor::orderBy('razon_social')->get();
        return response()->json($proveedores);
    }
}
