<?php

namespace Database\Factories;

use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para crear clientes de prueba.
 * 
 * Los clientes son entidades externas para facturación (sin login).
 */
class ClienteFactory extends Factory
{
    protected $model = Cliente::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $idType = fake()->randomElement(['CEDULA', 'RUC', 'PASAPORTE']);
        
        return [
            'id_type' => $idType,
            'id_number' => $this->generateIdNumber($idType),
            'razon_social' => $idType === 'RUC' ? fake()->company() : fake()->name(),
            'direccion' => fake()->address(),
            'telefono' => $this->generarTelefonoValido(),
            'email' => fake()->unique()->safeEmail(),
            'is_active' => true,
            'notes' => fake()->optional(0.3)->sentence(),
        ];
    }

    /**
     * Estado: Cliente con RUC (persona jurídica).
     */
    public function empresa(): static
    {
        return $this->state(fn (array $attributes) => [
            'id_type' => 'RUC',
            'id_number' => $this->generarRucValido(),
            'razon_social' => fake()->company() . ' ' . fake()->companySuffix(),
        ]);
    }

    /**
     * Estado: Cliente con cédula (persona natural).
     */
    public function personaNatural(): static
    {
        return $this->state(fn (array $attributes) => [
            'id_type' => 'CEDULA',
            'id_number' => $this->generarCedulaValida(),
            'razon_social' => fake()->name(),
        ]);
    }

    /**
     * Estado: Cliente extranjero con pasaporte.
     */
    public function extranjero(): static
    {
        return $this->state(fn (array $attributes) => [
            'id_type' => 'PASAPORTE',
            'id_number' => strtoupper(fake()->bothify('??######')),
            'razon_social' => fake()->name(),
        ]);
    }

    /**
     * Estado: Cliente inactivo.
     */
    public function inactivo(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Generar número de identificación según tipo.
     */
    private function generateIdNumber(string $type): string
    {
        return match($type) {
            'RUC' => $this->generarRucValido(),
            'CEDULA' => $this->generarCedulaValida(),
            'PASAPORTE' => strtoupper(fake()->bothify('??######')),
            default => $this->generarCedulaValida(),
        };
    }

    /**
     * Generar una cédula válida ecuatoriana (10 dígitos).
     */
    private function generarCedulaValida(): string
    {
        $provincia = str_pad(random_int(1, 24), 2, '0', STR_PAD_LEFT);
        $tercerDigito = random_int(0, 5);
        $siguientes = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $primerosNueve = $provincia . $tercerDigito . $siguientes;

        // Algoritmo módulo 10
        $coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $suma = 0;

        for ($i = 0; $i < 9; $i++) {
            $producto = intval($primerosNueve[$i]) * $coeficientes[$i];
            $suma += $producto > 9 ? $producto - 9 : $producto;
        }

        $verificador = (10 - ($suma % 10)) % 10;
        
        return $primerosNueve . $verificador;
    }

    /**
     * Generar un RUC válido ecuatoriano (13 dígitos).
     */
    private function generarRucValido(): string
    {
        // RUC = Cédula + 001
        return $this->generarCedulaValida() . '001';
    }

    /**
     * Generar teléfono válido ecuatoriano.
     */
    private function generarTelefonoValido(): string
    {
        $tipo = fake()->randomElement(['fijo', 'celular']);
        
        if ($tipo === 'celular') {
            return '09' . str_pad(random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        }
        
        $codigoArea = fake()->randomElement(['02', '03', '04', '05', '06', '07']);
        return $codigoArea . str_pad(random_int(0, 9999999), 7, '0', STR_PAD_LEFT);
    }
}
