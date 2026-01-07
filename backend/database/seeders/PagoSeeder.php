<?php

namespace Database\Seeders;

use App\Models\Factura;
use App\Models\Pago;
use Illuminate\Database\Seeder;

class PagoSeeder extends Seeder
{
    /**
     * Seed de pagos de facturas.
     */
    public function run(): void
    {
        $facturas = Factura::where('estado', '!=', 'anulada')
            ->limit(5)
            ->get();

        if ($facturas->isEmpty()) {
            $this->command->warn('⚠️ No hay facturas disponibles para registrar pagos');
            return;
        }

        $tiposPago = ['efectivo', 'tarjeta', 'transferencia', 'cheque'];

        foreach ($facturas as $factura) {
            // Crear pagos parciales o completos
            $monto_pendiente = $factura->total;
            $pago_num = 1;

            while ($monto_pendiente > 0 && $pago_num <= 3) {
                $monto = rand(1, 1) == 1 ? $monto_pendiente : rand(100, (int)$monto_pendiente);
                $monto = min($monto, $monto_pendiente);

                Pago::create([
                    'factura_id' => $factura->factura_id,
                    'tipo_pago' => $tiposPago[array_rand($tiposPago)],
                    'valor' => $monto,
                    'fecha' => $factura->fecha_emision->addDays(rand(1, 15)),
                ]);

                $monto_pendiente -= $monto;
                $pago_num++;
            }

            // Marcar como pagada si el total fue cubierto
            if ($monto_pendiente <= 0) {
                $factura->update(['estado' => 'pagada']);
            }
        }

        $this->command->info('✅ Pagos creados exitosamente');
    }
}
