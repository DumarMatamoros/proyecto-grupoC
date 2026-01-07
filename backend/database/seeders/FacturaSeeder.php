<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Models\Factura;
use App\Models\DetalleFactura;
use App\Models\Producto;
use Illuminate\Database\Seeder;

class FacturaSeeder extends Seeder
{
    /**
     * Seed de facturas y detalles de factura.
     */
    public function run(): void
    {
        $clientes = Cliente::where('is_active', true)->get();
        $empleados = Empleado::all();
        $sucursales = Sucursal::all();
        $productos = Producto::all();

        if ($clientes->isEmpty() || $empleados->isEmpty() || $sucursales->isEmpty() || $productos->isEmpty()) {
            $this->command->warn('⚠️ No hay datos necesarios para crear facturas');
            return;
        }

        $formasPago = array_keys(Factura::FORMAS_PAGO);
        $estados = array_keys(Factura::ESTADOS);

        for ($i = 1; $i <= 5; $i++) {
            $cliente = $clientes->random();
            $empleado = $empleados->random();
            $sucursal = $sucursales->first();
            $total = 0;

            $factura = Factura::create([
                'clave_acceso' => str_pad($i, 49, '0', STR_PAD_LEFT),
                'numero_factura' => str_pad($i, 9, '0', STR_PAD_LEFT),
                'numero_establecimiento' => '001',
                'punto_emision' => '001',
                'fecha_emision' => now()->subDays(rand(0, 10)),
                'hora' => now()->format('H:i:s'),
                'total_sin_impuestos' => 0,
                'descuento' => 0,
                'total_iva' => 0,
                'total' => 0,
                'estado' => $estados[array_rand($estados)],
                'cedula_cliente' => $cliente->id_number,
                'nombre_cliente' => $cliente->razon_social,
                'direccion_cliente' => $cliente->direccion,
                'telefono_cliente' => $cliente->telefono,
                'email_cliente' => $cliente->email,
                'forma_pago' => $formasPago[array_rand($formasPago)],
                'observaciones' => 'Factura de prueba',
                'cliente_id' => $cliente->cliente_id,
                'empleado_id' => $empleado->empleado_id,
                'sucursal_id' => $sucursal->sucursal_id,
                'usuario_id' => $empleado->usuario_id,
            ]);

            $totalSinImpuestos = 0;
            $totalIva = 0;

            // Crear detalles de factura
            $productosSeleccionados = $productos->random(rand(1, 4));
            foreach ($productosSeleccionados as $producto) {
                $cantidad = rand(1, 10);
                $precioUnitario = $producto->precio_unitario;
                $subtotal = $cantidad * $precioUnitario;
                $descuento = 0;
                $iva = $producto->iva_aplica ? ($subtotal * 0.12) : 0;
                $totalDetalle = $subtotal - $descuento + $iva;

                $totalSinImpuestos += $subtotal;
                $totalIva += $iva;
                $total += $totalDetalle;

                DetalleFactura::create([
                    'factura_id' => $factura->factura_id,
                    'producto_id' => $producto->producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'iva_aplica' => $producto->iva_aplica,
                    'porcentaje_iva' => $producto->iva_aplica ? 12 : 0,
                    'descuento' => $descuento,
                    'subtotal' => $subtotal,
                    'iva' => $iva,
                    'total_detalle' => $totalDetalle,
                ]);

                // Disminuir stock
                if ($producto->stock_actual >= $cantidad) {
                    $producto->stock_actual -= $cantidad;
                    $producto->save();
                }
            }

            // Actualizar totales de la factura
            $factura->update([
                'total_sin_impuestos' => $totalSinImpuestos,
                'total_iva' => $totalIva,
                'total' => $total,
            ]);
        }

        $this->command->info('✅ Facturas y detalles creados exitosamente');
    }
}
