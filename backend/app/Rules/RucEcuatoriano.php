<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class RucEcuatoriano implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Remover espacios y caracteres especiales
        $rucLimpio = preg_replace('/[^0-9]/', '', $value);

        // Verificar que sea numérico y tenga exactamente 13 dígitos
        if (!is_numeric($rucLimpio) || strlen($rucLimpio) !== 13) {
            $fail('El :attribute debe ser un número de 13 dígitos.');
            return;
        }

        // Los primeros 10 dígitos deben ser una cédula válida
        $cedula = substr($rucLimpio, 0, 10);
        
        // Validar la cédula usando la regla de cédula ecuatoriana
        $cedulaValidator = new CedulaEcuatoriana();
        $cedulaValida = false;
        
        try {
            $cedulaValidator->validate('cedula', $cedula, function() use (&$cedulaValida) {
                $cedulaValida = false;
            });
            $cedulaValida = true;
        } catch (\Exception $e) {
            $fail('El :attribute contiene una cédula inválida en sus primeros 10 dígitos.');
            return;
        }

        // Si llegamos aquí, validar el dígito verificador del RUC
        if (!$this->validarRuc($rucLimpio)) {
            $fail('El :attribute no es válido.');
            return;
        }
    }

    /**
     * Validar RUC ecuatoriano.
     *
     * @param string $ruc
     * @return bool
     */
    private function validarRuc(string $ruc): bool
    {
        // Coeficientes para el cálculo (primeros 12 dígitos)
        $coeficientes = [3, 2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4];
        $suma = 0;

        // Procesar los primeros 12 dígitos
        for ($i = 0; $i < 12; $i++) {
            $digito = intval(substr($ruc, $i, 1));
            $producto = $digito * $coeficientes[$i];

            // Si el producto es mayor a 9, restar 9
            if ($producto > 9) {
                $producto -= 9;
            }

            $suma += $producto;
        }

        // Calcular el módulo 11
        $digito_verificador = (11 - ($suma % 11));
        
        // Si el resultado es 11, es 0. Si es 10, es 1
        if ($digito_verificador === 11) {
            $digito_verificador = 0;
        } elseif ($digito_verificador === 10) {
            $digito_verificador = 1;
        }

        // Comparar con el dígito verificador del RUC (última posición)
        return $digito_verificador === intval(substr($ruc, 12, 1));
    }
}
