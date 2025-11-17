<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Cliente>
 */
class ClienteFactory extends Factory
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
            'ruc_cedula' => $this->generarCedulaValida(),
            'razon_social' => fake()->optional()->company(),
            'direccion' => fake()->address(),
            'telefono' => $this->generarTelefonoValido(),
            'tipo' => fake()->randomElement(['natural', 'juridica']),
        ];
    }

    /**
     * Generar una cédula válida ecuatoriana.
     */
    private function generarCedulaValida(): string
    {
        // Generar 9 dígitos aleatorios
        $primerosDos = str_pad(random_int(1, 24), 2, '0', STR_PAD_LEFT); // Código de provincia
        $siguientes = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $primerosNueve = $primerosDos . $siguientes;

        // Calcular el dígito verificador
        $coeficientes = [2, 3, 4, 5, 6, 7, 8, 9, 2];
        $suma = 0;

        for ($i = 0; $i < 9; $i++) {
            $digito = intval(substr($primerosNueve, $i, 1));
            $producto = $digito * $coeficientes[$i];

            if ($producto > 9) {
                $producto -= 9;
            }

            $suma += $producto;
        }

        $verificador = (10 - ($suma % 10)) % 10;

        return $primerosNueve . $verificador;
    }

    /**
     * Generar un teléfono válido ecuatoriano.
     */
    private function generarTelefonoValido(): string
    {
        // Números válidos: comienzan con 0, 2, 6, 9 y tienen 10 dígitos
        $prefijos = ['09', '06', '02', '023']; // Celular y fijo
        $prefijo = fake()->randomElement($prefijos);

        if (strlen($prefijo) === 4) {
            // Fijo de 4 dígitos iniciales
            $restante = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            return $prefijo . $restante;
        } else {
            // Celular o números regulares
            $restante = str_pad(random_int(0, 9999999), 8, '0', STR_PAD_LEFT);
            return $prefijo . $restante;
        }
    }
}
