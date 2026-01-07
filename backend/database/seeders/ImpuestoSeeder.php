<?php

namespace Database\Seeders;

use App\Models\Impuesto;
use Illuminate\Database\Seeder;

class ImpuestoSeeder extends Seeder
{
    /**
     * Seed de impuestos (IVA, ICE, etc.) según Ecuador.
     */
    public function run(): void
    {
        $impuestos = [
            [
                'tipo' => 'IVA 12%',
                'porcentaje' => 12,
            ],
            [
                'tipo' => 'IVA 0%',
                'porcentaje' => 0,
            ],
            [
                'tipo' => 'ICE Alcoholes',
                'porcentaje' => 75,
            ],
            [
                'tipo' => 'ICE Cigarrillos',
                'porcentaje' => 150,
            ],
            [
                'tipo' => 'Retención IVA 30%',
                'porcentaje' => 30,
            ],
            [
                'tipo' => 'Retención IVA 70%',
                'porcentaje' => 70,
            ],
            [
                'tipo' => 'Retención Renta 1%',
                'porcentaje' => 1,
            ],
        ];

        foreach ($impuestos as $impuesto) {
            Impuesto::firstOrCreate(
                ['tipo' => $impuesto['tipo']],
                $impuesto
            );
        }

        $this->command->info('✅ Impuestos creados exitosamente');
    }
}
