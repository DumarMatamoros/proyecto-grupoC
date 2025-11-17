<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Proveedor>
 */
class ProveedorFactory extends Factory
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
            'ruc' => $this->generarRucValido(),
            'razon_social' => fake()->optional()->company(),
            'direccion' => fake()->address(),
            'telefono' => $this->generarTelefonoValido(),
            'sitio_web' => fake()->optional()->url(),
        ];
    }

    /**
     * Generar un RUC válido ecuatoriano.
     */
    private function generarRucValido(): string
    {
        // Generar cédula válida (primeros 10 dígitos)
        $cedula = $this->generarCedulaValida();

        // Los 3 dígitos de entidad (generalmente 001)
        $entidad = '001';

        // Primeros 12 dígitos
        $primeros12 = $cedula . $entidad;

        // Calcular dígito verificador
        $coeficientes = [3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4];
        $suma = 0;

        for ($i = 0; $i < 12; $i++) {
            $digito = intval(substr($primeros12, $i, 1));
            $producto = $digito * $coeficientes[$i];

            if ($producto > 9) {
                $producto -= 9;
            }

            $suma += $producto;
        }

        $verificador = (11 - ($suma % 11));

        if ($verificador === 11) {
            $verificador = 0;
        } elseif ($verificador === 10) {
            $verificador = 1;
        }

        return $primeros12 . $verificador;
    }

    /**
     * Generar una cédula válida ecuatoriana.
     */
    private function generarCedulaValida(): string
    {
        $primerosDos = str_pad(random_int(1, 24), 2, '0', STR_PAD_LEFT);
        $siguientes = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $primerosNueve = $primerosDos . $siguientes;

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
        $prefijos = ['09', '06', '02', '023'];
        $prefijo = fake()->randomElement($prefijos);

        if (strlen($prefijo) === 4) {
            $restante = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            return $prefijo . $restante;
        } else {
            $restante = str_pad(random_int(0, 9999999), 8, '0', STR_PAD_LEFT);
            return $prefijo . $restante;
        }
    }
}
