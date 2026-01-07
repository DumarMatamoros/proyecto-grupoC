<?php

namespace Database\Seeders;

use App\Models\Proveedor;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Producto;
use Illuminate\Database\Seeder;

class CompraSeeder extends Seeder
{
    /**
     * Seed de compras y detalles de compra.
     */
    public function run(): void
    {
        $proveedores = Proveedor::where('is_active', true)->get();
        $productos = Producto::all();

        if ($proveedores->isEmpty() || $productos->isEmpty()) {
            $this->command->warn('⚠️ No hay proveedores o productos disponibles');
            return;
        }

        $comprasData = [
            [
                'numero_factura_proveedor' => 'FAC-2025-001',
                'fecha' => now()->subDays(10),
            ],
            [
                'numero_factura_proveedor' => 'FAC-2025-002',
                'fecha' => now()->subDays(5),
            ],
            [
                'numero_factura_proveedor' => 'FAC-2025-003',
                'fecha' => now(),
            ],
        ];

        foreach ($comprasData as $compraData) {
            $proveedor = $proveedores->random();
            $total = 0;

            $compra = Compra::create([
                'fecha' => $compraData['fecha'],
                'numero_factura_proveedor' => $compraData['numero_factura_proveedor'],
                'total' => 0, // Será actualizado después
                'proveedor_id' => $proveedor->proveedor_id,
            ]);

            // Crear detalles de compra
            $productosSeleccionados = $productos->random(rand(2, 5));
            foreach ($productosSeleccionados as $producto) {
                $cantidad = rand(5, 50);
                $precio = $producto->precio_costo;
                $subtotal = $cantidad * $precio;
                $iva = $subtotal * 0.12; // IVA 12%
                $totalDetalle = $subtotal + $iva;
                $total += $totalDetalle;

                DetalleCompra::create([
                    'compra_id' => $compra->compra_id,
                    'producto_id' => $producto->producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio,
                    'subtotal' => $subtotal,
                    'iva' => $iva,
                    'total' => $totalDetalle,
                    'fecha_expiracion' => $producto->categoria_id == 4 ? now()->addMonths(6) : null,
                ]);

                // Actualizar stock del producto
                $producto->stock_actual += $cantidad;
                $producto->save();
            }

            // Actualizar total de la compra
            $compra->update(['total' => $total]);
        }

        $this->command->info('✅ Compras y detalles creados exitosamente');
    }
}
