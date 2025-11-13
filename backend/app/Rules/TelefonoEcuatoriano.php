<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class TelefonoEcuatoriano implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Remover espacios, guiones y caracteres especiales
        $telefonoLimpio = preg_replace('/[^0-9]/', '', $value);

        // Verificar que sea numérico y tenga exactamente 10 dígitos
        if (!is_numeric($telefonoLimpio) || strlen($telefonoLimpio) !== 10) {
            $fail('El :attribute debe ser un número de 10 dígitos.');
            return;
        }

        // Verificar que comience con código de país válido (0, 6, 9 o 2 para fijos)
        $primerDigito = intval(substr($telefonoLimpio, 0, 1));
        
        if (!in_array($primerDigito, [0, 2, 6, 9])) {
            $fail('El :attribute no es válido para Ecuador.');
            return;
        }

        // Verificar que no sean todos dígitos iguales
        if (preg_match('/^(\d)\1{9}$/', $telefonoLimpio)) {
            $fail('El :attribute no puede contener todos los dígitos iguales.');
            return;
        }
    }
}
