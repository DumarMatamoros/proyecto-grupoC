<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Administrador>
 */
class AdministradorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'usuario_id' => null, // Se asignará al crear
            'nivel' => fake()->randomElement(['super', 'moderador', 'editor']),
            'permisos' => json_encode([
                'usuarios' => true,
                'empleados' => true,
                'clientes' => true,
                'proveedores' => true,
                'reportes' => true,
            ]),
        ];
    }
}
