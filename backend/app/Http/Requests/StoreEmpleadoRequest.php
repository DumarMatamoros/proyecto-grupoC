<?php

namespace App\Http\Requests;

use App\Rules\CedulaEcuatoriana;
use App\Rules\TelefonoEcuatoriano;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmpleadoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuarios',
            'password' => 'required|string|min:6|confirmed',
            'cedula' => ['required', 'unique:clientes,ruc_cedula', new CedulaEcuatoriana()],
            'telefono' => ['required', new TelefonoEcuatoriano()],
            'sucursal_id' => 'required|exists:sucursales,sucursal_id',
            'departamento' => 'required|string|max:100',
            'fecha_inicio' => 'required|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'cedula.required' => 'La cédula es requerida.',
            'cedula.unique' => 'Esta cédula ya está registrada.',
            'telefono.required' => 'El teléfono es requerido.',
            'sucursal_id.required' => 'La sucursal es requerida.',
            'sucursal_id.exists' => 'La sucursal seleccionada no existe.',
            'departamento.required' => 'El departamento es requerido.',
            'fecha_inicio.required' => 'La fecha de inicio es requerida.',
            'fecha_inicio.date' => 'La fecha debe ser válida.',
        ];
    }
}
