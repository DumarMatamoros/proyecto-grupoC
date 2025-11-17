<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacturaRequest;
use App\Models\Factura;
use App\Models\DetalleFactura;
use App\Models\Producto;
use App\Models\Cliente;
use App\Models\Configuracion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FacturaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Factura::query();

        // Filtrar por sucursal si se proporciona
        if ($request->has('sucursal_id')) {
            $query->where('sucursal_id', $request->sucursal_id);
        }

        // Filtrar por cliente si se proporciona
        if ($request->has('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        // Ordenar por fecha descendente
        $facturas = $query->with(['cliente', 'detalles.producto', 'sucursal'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Facturas obtenidas exitosamente',
            'data' => $facturas
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     * Acepta cliente registrado O consumidor final (9999999999)
     */
    public function store(StoreFacturaRequest $request)
    {
        try {
            DB::beginTransaction();

            $usuario = $request->user();
            $validated = $request->validated();

            // Determinar si es consumidor final
            $es_consumidor_final = $validated['cedula_cliente'] === '9999999999';

            // Obtener o crear cliente
            if ($es_consumidor_final) {
                $cliente = null;
                $cedula_cliente = '9999999999';
                $nombre_cliente = $validated['nombre_cliente'] ?? 'CONSUMIDOR FINAL';
            } else {
                $cliente = Cliente::findOrFail($validated['cliente_id'] ?? null);
                $cedula_cliente = $cliente->ruc_cedula;
                $nombre_cliente = $cliente->usuario->nombre ?? $validated['nombre_cliente'];
            }

            // Crear factura
            $factura = Factura::create([
                'cliente_id' => $cliente?->cliente_id,
                'cedula_cliente' => $cedula_cliente,
                'nombre_cliente' => $nombre_cliente,
                'sucursal_id' => $validated['sucursal_id'],
                'numero_factura' => $this->generarNumeroFactura($validated['sucursal_id']),
                'fecha' => now(),
                'subtotal' => 0,
                'impuesto' => 0,
                'total' => 0,
                'estado' => 'pendiente',
                'observaciones' => $validated['observaciones'] ?? null,
            ]);

            // Procesar items
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $producto = Producto::findOrFail($item['producto_id']);
                $cantidad = $item['cantidad'];
                $precio_unitario = $item['precio_unitario'];
                $subtotal_item = $cantidad * $precio_unitario;

                DetalleFactura::create([
                    'factura_id' => $factura->factura_id,
                    'producto_id' => $producto->producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio_unitario,
                    'subtotal' => $subtotal_item,
                ]);

                $subtotal += $subtotal_item;
            }

            // Calcular totales usando IVA configurable
            $porcentaje_iva = Configuracion::obtener('iva_porcentaje', 12);
            $impuesto = $subtotal * ($porcentaje_iva / 100);
            $total = $subtotal + $impuesto;

            $factura->update([
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Factura creada exitosamente',
                'data' => $factura->load(['cliente', 'detalles.producto', 'sucursal'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $factura = Factura::with(['cliente', 'detalles.producto', 'sucursal'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Factura obtenida exitosamente',
                'data' => $factura
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Factura no encontrada'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        try {
            $factura = Factura::findOrFail($id);

            // Solo permitir actualizar si está en estado pendiente
            if ($factura->estado !== 'pendiente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden editar facturas en estado pendiente'
                ], 422);
            }

            $validated = $request->validate([
                'observaciones' => 'sometimes|nullable|string|max:1000',
                'estado' => 'sometimes|in:pendiente,emitida,cancelada,anulada',
            ]);

            $factura->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Factura actualizada exitosamente',
                'data' => $factura->load(['cliente', 'detalles.producto', 'sucursal'])
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $factura = Factura::findOrFail($id);

            // Solo permitir eliminar si está en estado pendiente
            if ($factura->estado !== 'pendiente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden eliminar facturas en estado pendiente'
                ], 422);
            }

            $factura->detalles()->delete();
            $factura->delete();

            return response()->json([
                'success' => true,
                'message' => 'Factura eliminada exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar número de factura único
     */
    private function generarNumeroFactura($sucursal_id): string
    {
        $ultimaFactura = Factura::where('sucursal_id', $sucursal_id)
            ->latest('created_at')
            ->first();

        $numero = $ultimaFactura ? intval(substr($ultimaFactura->numero_factura, -6)) + 1 : 1;

        return sprintf('%03d-%03d-%06d', $sucursal_id, 1, $numero);
    }
}
