<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClienteRequest extends FormRequest
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
     * NO incluye validación de cédula para permitir actualizaciones sin modificarla
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255',
            'razon_social' => 'sometimes|nullable|string|max:255',
            'direccion' => 'sometimes|string|max:500',
            'telefono' => 'sometimes|string|max:20',
            'tipo' => 'sometimes|in:natural,juridica',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre.string' => 'El nombre debe ser texto.',
            'nombre.max' => 'El nombre no puede exceder 255 caracteres.',
            'email.email' => 'El email debe ser un correo válido.',
            'email.max' => 'El email no puede exceder 255 caracteres.',
            'razon_social.string' => 'La razón social debe ser texto.',
            'razon_social.max' => 'La razón social no puede exceder 255 caracteres.',
            'direccion.string' => 'La dirección debe ser texto.',
            'direccion.max' => 'La dirección no puede exceder 500 caracteres.',
            'telefono.string' => 'El teléfono debe ser texto.',
            'telefono.max' => 'El teléfono no puede exceder 20 caracteres.',
            'tipo.in' => 'El tipo debe ser "natural" o "juridica".',
        ];
    }
}
