<?php

namespace App\Http\Requests;

use App\Rules\RucEcuatoriano;
use App\Rules\TelefonoEcuatoriano;
use Illuminate\Foundation\Http\FormRequest;

class StoreProveedorRequest extends FormRequest
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
            'ruc' => ['required', 'unique:proveedores', new RucEcuatoriano()],
            'razon_social' => 'required|string|max:255',
            'direccion' => 'required|string|max:500',
            'telefono' => ['required', new TelefonoEcuatoriano()],
            'sitio_web' => 'nullable|url',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ruc.required' => 'El RUC es requerido.',
            'ruc.unique' => 'Este RUC ya está registrado.',
            'telefono.required' => 'El teléfono es requerido.',
            'direccion.required' => 'La dirección es requerida.',
            'razon_social.required' => 'La razón social es requerida.',
            'sitio_web.url' => 'El sitio web debe ser una URL válida.',
        ];
    }
}
