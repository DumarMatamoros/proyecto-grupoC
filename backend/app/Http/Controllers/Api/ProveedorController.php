<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Controlador para gestión de Proveedores.
 * 
 * Los Proveedores son entidades externas a las que se les compra mercadería/servicios.
 * NO tienen acceso al sistema (sin login, sin password).
 * 
 * Cumple con los requisitos del SRI (Ecuador) para compras y retenciones.
 */
class ProveedorController extends Controller
{
    /**
     * Listar todos los proveedores con paginación y búsqueda.
     */
    public function index(Request $request)
    {
        try {
            $query = Proveedor::query();

            // Filtro por búsqueda
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Filtro por tipo de identificación
            if ($request->has('id_type') && $request->id_type) {
                $query->byIdType($request->id_type);
            }

            // Filtro por tipo de proveedor
            if ($request->has('tipo_proveedor') && $request->tipo_proveedor) {
                $query->byTipo($request->tipo_proveedor);
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
            $proveedores = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $proveedores,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener proveedores',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear un nuevo proveedor.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_type' => ['required', Rule::in(array_keys(Proveedor::ID_TYPES))],
                'id_number' => [
                    'required',
                    'string',
                    'unique:proveedores,id_number',
                    function ($attribute, $value, $fail) use ($request) {
                        if (!Proveedor::validateIdNumber($request->id_type, $value)) {
                            $fail($this->getIdNumberErrorMessage($request->id_type));
                        }
                    },
                ],
                'razon_social' => 'required|string|max:255',
                'nombre_comercial' => 'nullable|string|max:255',
                'direccion' => 'required|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'sitio_web' => 'nullable|url|max:255',
                'email' => 'nullable|email|max:255',
                'contacto_nombre' => 'nullable|string|max:100',
                'contacto_telefono' => 'nullable|string|max:20',
                'contacto_email' => 'nullable|email|max:255',
                'tipo_proveedor' => ['nullable', Rule::in(array_keys(Proveedor::TIPOS_PROVEEDOR))],
                'banco' => 'nullable|string|max:100',
                'cuenta_bancaria' => 'nullable|string|max:30',
                'tipo_cuenta' => ['nullable', Rule::in(array_keys(Proveedor::TIPOS_CUENTA))],
                'notes' => 'nullable|string|max:1000',
            ], $this->validationMessages());

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $proveedor = Proveedor::create([
                'id_type' => $request->id_type,
                'id_number' => $request->id_number,
                'razon_social' => $request->razon_social,
                'nombre_comercial' => $request->nombre_comercial,
                'direccion' => $request->direccion,
                'telefono' => $request->telefono,
                'sitio_web' => $request->sitio_web,
                'email' => $request->email,
                'contacto_nombre' => $request->contacto_nombre,
                'contacto_telefono' => $request->contacto_telefono,
                'contacto_email' => $request->contacto_email,
                'tipo_proveedor' => $request->tipo_proveedor ?? 'BIENES',
                'banco' => $request->banco,
                'cuenta_bancaria' => $request->cuenta_bancaria,
                'tipo_cuenta' => $request->tipo_cuenta,
                'notes' => $request->notes,
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proveedor creado exitosamente',
                'data' => $proveedor,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar un proveedor específico.
     */
    public function show($id)
    {
        try {
            $proveedor = Proveedor::with('compras')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $proveedor,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar un proveedor existente.
     */
    public function update(Request $request, $id)
    {
        try {
            $proveedor = Proveedor::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'id_type' => ['sometimes', 'required', Rule::in(array_keys(Proveedor::ID_TYPES))],
                'id_number' => [
                    'sometimes',
                    'required',
                    'string',
                    Rule::unique('proveedores', 'id_number')->ignore($id, 'proveedor_id'),
                    function ($attribute, $value, $fail) use ($request, $proveedor) {
                        $type = $request->id_type ?? $proveedor->id_type;
                        if (!Proveedor::validateIdNumber($type, $value)) {
                            $fail($this->getIdNumberErrorMessage($type));
                        }
                    },
                ],
                'razon_social' => 'sometimes|required|string|max:255',
                'nombre_comercial' => 'nullable|string|max:255',
                'direccion' => 'sometimes|required|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'sitio_web' => 'nullable|url|max:255',
                'email' => 'nullable|email|max:255',
                'contacto_nombre' => 'nullable|string|max:100',
                'contacto_telefono' => 'nullable|string|max:20',
                'contacto_email' => 'nullable|email|max:255',
                'tipo_proveedor' => ['nullable', Rule::in(array_keys(Proveedor::TIPOS_PROVEEDOR))],
                'banco' => 'nullable|string|max:100',
                'cuenta_bancaria' => 'nullable|string|max:30',
                'tipo_cuenta' => ['nullable', Rule::in(array_keys(Proveedor::TIPOS_CUENTA))],
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

            $proveedor->update($request->only([
                'id_type',
                'id_number',
                'razon_social',
                'nombre_comercial',
                'direccion',
                'telefono',
                'sitio_web',
                'email',
                'contacto_nombre',
                'contacto_telefono',
                'contacto_email',
                'tipo_proveedor',
                'banco',
                'cuenta_bancaria',
                'tipo_cuenta',
                'notes',
                'is_active',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Proveedor actualizado exitosamente',
                'data' => $proveedor->fresh(),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un proveedor (soft delete - desactivar).
     */
    public function destroy($id)
    {
        try {
            $proveedor = Proveedor::findOrFail($id);

            // Verificar si tiene compras asociadas
            if ($proveedor->compras()->count() > 0) {
                // Solo desactivar, no eliminar
                $proveedor->update(['is_active' => false]);

                return response()->json([
                    'success' => true,
                    'message' => 'Proveedor desactivado (tiene compras asociadas)',
                    'data' => $proveedor->fresh(),
                ], 200);
            }

            // Si no tiene compras, eliminar permanentemente
            $proveedor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Proveedor eliminado exitosamente',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar proveedor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar proveedores por término (para autocompletado en compras).
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

            $proveedores = Proveedor::active()
                ->search($term)
                ->select('proveedor_id', 'id_type', 'id_number', 'razon_social', 'nombre_comercial', 'direccion', 'email', 'telefono', 'tipo_proveedor')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $proveedores,
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
     * Obtener tipos de identificación disponibles.
     */
    public function getIdTypes()
    {
        return response()->json([
            'success' => true,
            'data' => Proveedor::ID_TYPES,
        ], 200);
    }

    /**
     * Obtener tipos de proveedor disponibles.
     */
    public function getTiposProveedor()
    {
        return response()->json([
            'success' => true,
            'data' => Proveedor::TIPOS_PROVEEDOR,
        ], 200);
    }

    /**
     * Obtener estadísticas de proveedores.
     */
    public function estadisticas()
    {
        try {
            $total = Proveedor::count();
            $activos = Proveedor::active()->count();
            $inactivos = $total - $activos;
            
            $porTipo = Proveedor::selectRaw('tipo_proveedor, count(*) as total')
                ->groupBy('tipo_proveedor')
                ->pluck('total', 'tipo_proveedor')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'activos' => $activos,
                    'inactivos' => $inactivos,
                    'por_tipo' => $porTipo,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage(),
            ], 500);
        }
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
            'razon_social.required' => 'La razón social es obligatoria',
            'razon_social.max' => 'La razón social no puede exceder 255 caracteres',
            'direccion.required' => 'La dirección es obligatoria',
            'direccion.max' => 'La dirección no puede exceder 500 caracteres',
            'email.email' => 'El email debe ser una dirección válida',
            'sitio_web.url' => 'El sitio web debe ser una URL válida',
            'contacto_email.email' => 'El email de contacto debe ser una dirección válida',
            'tipo_proveedor.in' => 'El tipo de proveedor no es válido',
            'tipo_cuenta.in' => 'El tipo de cuenta no es válido',
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
            default => 'Número de identificación inválido',
        };
    }
}
