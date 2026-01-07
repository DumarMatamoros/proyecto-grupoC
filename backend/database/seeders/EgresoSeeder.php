<?php

namespace Database\Seeders;

use App\Models\Sucursal;
use App\Models\Egreso;
use App\Models\DetalleEgreso;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Database\Seeder;

class EgresoSeeder extends Seeder
{
    /**
     * Seed de egresos y detalles de egresos.
     */
    public function run(): void
    {
        $sucursales = Sucursal::all();
        $usuarios = User::where('tipo', 'empleado')->limit(3)->get();
        $productos = Producto::all();

        if ($sucursales->isEmpty() || $usuarios->isEmpty() || $productos->isEmpty()) {
            $this->command->warn('⚠️ No hay datos necesarios');
            return;
        }

        $motivos = array_keys(Egreso::MOTIVOS);

        for ($i = 0; $i < 10; $i++) {
            $sucursal = $sucursales->random();
            $usuario = $usuarios->random();
            $motivo = $motivos[array_rand($motivos)];
            $totalUnidades = 0;
            $valorTotal = 0;

            $egreso = Egreso::create([
                'fecha' => now()->subDays(rand(0, 30)),
                'motivo' => $motivo,
                'observaciones' => fake()->optional()->sentence(),
                'total_unidades' => 0,
                'valor_total' => 0,
                'usuario_id' => $usuario->usuario_id,
                'sucursal_id' => $sucursal->sucursal_id,
            ]);

            // Crear detalles de egreso
            for ($j = 0; $j < rand(1, 3); $j++) {
                $producto = $productos->random();
                $cantidad = rand(1, 20);
                $precioUnitario = $producto->precio_unitario;
                $subtotal = $cantidad * $precioUnitario;
                $totalUnidades += $cantidad;
                $valorTotal += $subtotal;

                DetalleEgreso::create([
                    'egreso_id' => $egreso->egreso_id,
                    'producto_id' => $producto->producto_id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $subtotal,
                    'motivo_detalle' => fake()->sentence(),
                    'fecha_vencimiento' => fake()->optional()->dateTimeBetween('-3 months', '+3 months'),
                ]);
            }

            // Actualizar total del egreso
            $egreso->update([
                'total_unidades' => $totalUnidades,
                'valor_total' => $valorTotal,
            ]);
        }

        $this->command->info('✅ Egresos y detalles creados exitosamente');
    }
}
