<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Empleado>
 */
class EmpleadoFactory extends Factory
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
            'sucursal_id' => 1, // Por defecto, sucursal 1
            'departamento' => fake()->randomElement(['Ventas', 'Administración', 'Logística', 'IT', 'Recursos Humanos']),
            'fecha_inicio' => fake()->dateTimeBetween('-5 years', 'now'),
        ];
    }
}
