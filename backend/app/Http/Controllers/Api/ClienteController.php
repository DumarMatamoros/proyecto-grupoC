<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Controlador para gestión de Clientes.
 * 
 * Los Clientes son entidades externas a las que se les factura.
 * NO tienen acceso al sistema (sin login, sin password).
 * 
 * Cumple con los requisitos del SRI (Ecuador) para facturación electrónica.
 */
class ClienteController extends Controller
{
    /**
     * Listar todos los clientes con paginación y búsqueda.
     */
    public function index(Request $request)
    {
        try {
            $query = Cliente::query();

            // Filtro por búsqueda
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Filtro por tipo de identificación
            if ($request->has('id_type') && $request->id_type) {
                $query->byIdType($request->id_type);
            }

            // Filtro por estado activo
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            }

            // Ordenamiento
            $sortBy = $request->get('sort_by', 'razon_social');
            $sortDir = $request->get('sort_dir', 'asc');
            $query->orderBy($sortBy, $sortDir);

            // Paginación
            $perPage = $request->get('per_page', 15);
            $clientes = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $clientes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener clientes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear un nuevo cliente.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_type' => ['required', Rule::in(array_keys(Cliente::ID_TYPES))],
                'id_number' => [
                    'required',
                    'string',
                    'unique:clientes,id_number',
                    function ($attribute, $value, $fail) use ($request) {
                        if (!Cliente::validateIdNumber($request->id_type, $value)) {
                            $fail($this->getIdNumberErrorMessage($request->id_type));
                        }
                    },
                ],
                'razon_social' => 'required|string|max:255',
                'direccion' => 'required|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'notes' => 'nullable|string|max:1000',
            ], $this->validationMessages());

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $cliente = Cliente::create([
                'id_type' => $request->id_type,
                'id_number' => $request->id_number,
                'razon_social' => $request->razon_social,
                'direccion' => $request->direccion,
                'telefono' => $request->telefono,
                'email' => $request->email,
                'notes' => $request->notes,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cliente creado exitosamente',
                'data' => $cliente,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un cliente específico.
     */
    public function show($id)
    {
        try {
            $cliente = Cliente::with('facturas')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $cliente,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar un cliente existente.
     */
    public function update(Request $request, $id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'id_type' => ['sometimes', 'required', Rule::in(array_keys(Cliente::ID_TYPES))],
                'id_number' => [
                    'sometimes',
                    'required',
                    'string',
                    Rule::unique('clientes', 'id_number')->ignore($id, 'cliente_id'),
                    function ($attribute, $value, $fail) use ($request, $cliente) {
                        $type = $request->id_type ?? $cliente->id_type;
                        if (!Cliente::validateIdNumber($type, $value)) {
                            $fail($this->getIdNumberErrorMessage($type));
                        }
                    },
                ],
                'razon_social' => 'sometimes|required|string|max:255',
                'direccion' => 'sometimes|required|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'notes' => 'nullable|string|max:1000',
                'is_active' => 'sometimes|boolean',
            ], $this->validationMessages());

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $cliente->update($request->only([
                'id_type',
                'id_number',
                'razon_social',
                'direccion',
                'telefono',
                'email',
                'notes',
                'is_active',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Cliente actualizado exitosamente',
                'data' => $cliente->fresh(),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un cliente (soft delete - desactivar).
     */
    public function destroy($id)
    {
        try {
            $cliente = Cliente::findOrFail($id);

            // Verificar si tiene facturas asociadas
            if ($cliente->facturas()->count() > 0) {
                // Solo desactivar, no eliminar
                $cliente->update(['is_active' => false]);

                return response()->json([
                    'success' => true,
                    'message' => 'Cliente desactivado (tiene facturas asociadas)',
                    'data' => $cliente->fresh(),
                ], 200);
            }

            // Si no tiene facturas, eliminar permanentemente
            $cliente->delete();

            return response()->json([
                'success' => true,
                'message' => 'Cliente eliminado exitosamente',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar cliente',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar clientes por término (para autocompletado en facturación).
     */
    public function search(Request $request)
    {
        try {
            $term = $request->get('q', '');
            
            if (strlen($term) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ], 200);
            }

            $clientes = Cliente::active()
                ->search($term)
                ->select('cliente_id', 'id_type', 'id_number', 'razon_social', 'direccion', 'email', 'telefono')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clientes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener o crear Consumidor Final.
     */
    public function getConsumidorFinal()
    {
        try {
            $consumidorFinal = Cliente::getConsumidorFinal();

            return response()->json([
                'success' => true,
                'data' => $consumidorFinal,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener Consumidor Final',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener tipos de identificación disponibles.
     */
    public function getIdTypes()
    {
        return response()->json([
            'success' => true,
            'data' => Cliente::ID_TYPES,
        ], 200);
    }

    /**
     * Mensajes de validación personalizados.
     */
    private function validationMessages(): array
    {
        return [
            'id_type.required' => 'El tipo de identificación es obligatorio',
            'id_type.in' => 'El tipo de identificación no es válido',
            'id_number.required' => 'El número de identificación es obligatorio',
            'id_number.unique' => 'Este número de identificación ya está registrado',
            'razon_social.required' => 'La razón social/nombres es obligatoria',
            'razon_social.max' => 'La razón social no puede exceder 255 caracteres',
            'direccion.required' => 'La dirección es obligatoria',
            'direccion.max' => 'La dirección no puede exceder 500 caracteres',
            'email.email' => 'El email debe ser una dirección válida',
            'telefono.max' => 'El teléfono no puede exceder 20 caracteres',
        ];
    }

    /**
     * Obtener mensaje de error según tipo de identificación.
     */
    private function getIdNumberErrorMessage(string $type): string
    {
        return match($type) {
            'RUC' => 'El RUC debe tener exactamente 13 dígitos numéricos',
            'CEDULA' => 'La cédula debe tener exactamente 10 dígitos numéricos',
            'PASAPORTE' => 'El pasaporte debe tener entre 5 y 20 caracteres',
            'CONSUMIDOR_FINAL' => 'El ID de Consumidor Final debe ser 9999999999999',
            default => 'Número de identificación inválido',
        };
    }
}
