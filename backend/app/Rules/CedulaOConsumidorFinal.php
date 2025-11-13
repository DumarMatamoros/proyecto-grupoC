<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CedulaOConsumidorFinal implements ValidationRule
{
    private CedulaEcuatoriana $cedulaRule;

    public function __construct()
    {
        $this->cedulaRule = new CedulaEcuatoriana();
    }

    /**
     * Run the validation rule.
     * Acepta cédula válida ecuatoriana O consumidor final (9999999999)
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Si es consumidor final, acepta sin validar más
        if ($value === '9999999999') {
            return;
        }

        // Si no, valida como cédula normal ecuatoriana
        $this->cedulaRule->validate($attribute, $value, $fail);
    }
}
