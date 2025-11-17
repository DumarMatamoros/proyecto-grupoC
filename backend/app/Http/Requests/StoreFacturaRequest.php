<?php

namespace App\Http\Requests;

use App\Rules\CedulaOConsumidorFinal;
use App\Rules\TelefonoEcuatoriano;
use Illuminate\Foundation\Http\FormRequest;

class StoreFacturaRequest extends FormRequest
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
     * Para facturación: acepta cédula válida O consumidor final (9999999999)
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cliente_id' => 'nullable|exists:clientes,cliente_id',
            'cedula_cliente' => ['nullable', new CedulaOConsumidorFinal()],
            'nombre_cliente' => 'required|string|max:255',
            'sucursal_id' => 'required|exists:sucursales,sucursal_id',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,producto_id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0.01',
            'observaciones' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'cliente_id.exists' => 'El cliente seleccionado no existe.',
            'cedula_cliente' => 'La cédula debe ser válida o 9999999999 para consumidor final.',
            'nombre_cliente.required' => 'El nombre del cliente es requerido.',
            'sucursal_id.required' => 'La sucursal es requerida.',
            'sucursal_id.exists' => 'La sucursal seleccionada no existe.',
            'items.required' => 'Debe incluir al menos un producto.',
            'items.min' => 'Debe incluir al menos un producto.',
            'items.*.producto_id.required' => 'El producto es requerido.',
            'items.*.producto_id.exists' => 'El producto seleccionado no existe.',
            'items.*.cantidad.required' => 'La cantidad es requerida.',
            'items.*.cantidad.integer' => 'La cantidad debe ser un número entero.',
            'items.*.cantidad.min' => 'La cantidad mínima es 1.',
            'items.*.precio_unitario.required' => 'El precio unitario es requerido.',
            'items.*.precio_unitario.numeric' => 'El precio debe ser un número.',
            'items.*.precio_unitario.min' => 'El precio mínimo es 0.01.',
        ];
    }
}
