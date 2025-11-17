<?php

namespace App\Http\Requests;

use App\Rules\CedulaEcuatoriana;
use App\Rules\TelefonoEcuatoriano;
use Illuminate\Foundation\Http\FormRequest;

class StoreClienteRequest extends FormRequest
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
            'ruc_cedula' => ['required', 'unique:clientes', new CedulaEcuatoriana()],
            'razon_social' => 'nullable|string|max:255',
            'direccion' => 'required|string|max:500',
            'telefono' => ['required', new TelefonoEcuatoriano()],
            'tipo' => 'required|in:natural,juridica',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ruc_cedula.required' => 'La cédula es requerida.',
            'ruc_cedula.unique' => 'Esta cédula ya está registrada.',
            'telefono.required' => 'El teléfono es requerido.',
            'direccion.required' => 'La dirección es requerida.',
            'tipo.required' => 'El tipo de cliente es requerido.',
            'tipo.in' => 'El tipo debe ser "natural" o "juridica".',
        ];
    }
}
