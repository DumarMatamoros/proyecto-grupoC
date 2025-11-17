<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CedulaEcuatoriana implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Verificar que sea numérico y tenga exactamente 10 dígitos
        if (!is_numeric($value) || strlen($value) !== 10) {
            $fail('La :attribute debe ser un número de 10 dígitos.');
            return;
        }

        // Verificar que no sean todos dígitos iguales
        if (preg_match('/^(\d)\1{9}$/', $value)) {
            $fail('La :attribute no puede contener todos los dígitos iguales.');
            return;
        }

        // Aplicar algoritmo de validación de cédula ecuatoriana
        if (!$this->validarCedula($value)) {
            $fail('La :attribute no es válida.');
            return;
        }
    }

    /**
     * Validar cédula ecuatoriana usando el algoritmo oficial.
     *
     * @param string $cedula
     * @return bool
     */
    private function validarCedula(string $cedula): bool
    {
        // Extraer el dígito verificador (último dígito)
        $verificador = intval(substr($cedula, 9, 1));

        // Coeficientes para el cálculo
        $coeficientes = [2, 3, 4, 5, 6, 7, 8, 9, 2];
        $suma = 0;

        // Procesar los primeros 9 dígitos
        for ($i = 0; $i < 9; $i++) {
            $digito = intval(substr($cedula, $i, 1));
            $producto = $digito * $coeficientes[$i];

            // Si el producto es mayor a 9, restar 9
            if ($producto > 9) {
                $producto -= 9;
            }

            $suma += $producto;
        }

        // Calcular el módulo 10
        $digito_verificador = (10 - ($suma % 10)) % 10;

        // Comparar con el dígito verificador de la cédula
        return $digito_verificador === $verificador;
    }
}
