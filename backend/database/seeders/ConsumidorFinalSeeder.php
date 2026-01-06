<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Seeder;

/**
 * Seeder para crear el cliente "Consumidor Final".
 * 
 * Según la normativa del SRI de Ecuador, todas las facturas
 * deben tener un cliente. Cuando no se identifica al comprador,
 * se usa "CONSUMIDOR FINAL" con ID 9999999999999.
 */
class ConsumidorFinalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🧾 Creando cliente Consumidor Final...');

        $consumidorFinal = Cliente::firstOrCreate(
            ['id_number' => Cliente::CONSUMIDOR_FINAL_ID],
            [
                'id_type' => 'CONSUMIDOR_FINAL',
                'razon_social' => 'CONSUMIDOR FINAL',
                'direccion' => 'N/A',
                'telefono' => 'N/A',
                'email' => null,
                'is_active' => true,
                'notes' => 'Cliente genérico para ventas sin identificación del comprador (normativa SRI)',
            ]
        );

        if ($consumidorFinal->wasRecentlyCreated) {
            $this->command->info('   ✓ Consumidor Final creado exitosamente');
        } else {
            $this->command->info('   ✓ Consumidor Final ya existía');
        }

        $this->command->info('');
        $this->command->info('✅ Cliente Consumidor Final configurado.');
        $this->command->info("   ID: {$consumidorFinal->cliente_id}");
        $this->command->info("   Identificación: {$consumidorFinal->id_number}");
    }
}
