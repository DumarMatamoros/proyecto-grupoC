<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConfiguracionController extends Controller
{
    /**
     * Display a listing of all configurations or filter by group
     */
    public function index(Request $request)
    {
        try {
            $query = Configuracion::query();

            // Filtrar por grupo si se proporciona
            if ($request->has('grupo')) {
                $query->where('grupo', $request->grupo);
            }

            // Solo mostrar configuraciones editables si se solicita
            if ($request->has('editables') && $request->editables == 1) {
                $query->where('editable', true);
            }

            $configuraciones = $query->get();

            return response()->json([
                'success' => true,
                'message' => 'Configuraciones obtenidas exitosamente',
                'data' => $configuraciones
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuraciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all settings as a flat key-value object for easy frontend access
     */
    public function getAllSettings()
    {
        try {
            $configuraciones = Configuracion::all();
            
            // Formato plano: { clave: valor }
            $settings = [];
            foreach ($configuraciones as $config) {
                $settings[$config->clave] = $config->getValorFormateado();
            }

            // Formato agrupado para fácil acceso
            $grouped = [];
            foreach ($configuraciones as $config) {
                $grupo = $config->grupo ?? 'general';
                if (!isset($grouped[$grupo])) {
                    $grouped[$grupo] = [];
                }
                $grouped[$grupo][$config->clave] = [
                    'valor' => $config->getValorFormateado(),
                    'tipo' => $config->tipo,
                    'descripcion' => $config->descripcion,
                    'editable' => $config->editable,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Configuraciones obtenidas exitosamente',
                'data' => [
                    'flat' => $settings,
                    'grouped' => $grouped,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuraciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific configuration by key
     */
    public function show(string $clave)
    {
        try {
            $configuracion = Configuracion::where('clave', $clave)->firstOrFail();

            return response()->json([
                'success' => true,
                'message' => 'Configuración obtenida exitosamente',
                'data' => $configuracion
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Configuración no encontrada'
            ], 404);
        }
    }

    /**
     * Update a configuration
     * Solo administradores pueden actualizar
     */
    public function update(Request $request, string $clave)
    {
        try {
            // Verificar que es administrador
            if ($request->user()->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo administradores pueden actualizar configuraciones'
                ], 403);
            }

            $configuracion = Configuracion::where('clave', $clave)->firstOrFail();

            // Verificar que es editable
            if (!$configuracion->editable) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta configuración no puede ser editada'
                ], 422);
            }

            // Validar entrada
            $validated = $request->validate([
                'valor' => 'required',
                'descripcion' => 'sometimes|nullable|string',
            ]);

            // Actualizar
            $configuracion->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Configuración actualizada exitosamente',
                'data' => $configuracion
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Configuración no encontrada'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get IVA percentage specifically
     */
    public function obtenerIVA()
    {
        try {
            $iva = Configuracion::obtener('iva_porcentaje', 12);

            return response()->json([
                'success' => true,
                'message' => 'IVA obtenido exitosamente',
                'data' => [
                    'porcentaje' => $iva,
                    'valor_decimal' => $iva / 100
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener IVA: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ICE percentage specifically
     */
    public function obtenerICE()
    {
        try {
            $ice = Configuracion::obtener('ice_porcentaje', 0);

            return response()->json([
                'success' => true,
                'message' => 'ICE obtenido exitosamente',
                'data' => [
                    'porcentaje' => $ice,
                    'valor_decimal' => $ice / 100
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener ICE: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get both IVA and ICE percentages
     */
    public function obtenerImpuestos()
    {
        try {
            $iva = Configuracion::obtener('iva_porcentaje', 15);
            $ice = Configuracion::obtener('ice_porcentaje', 0);

            return response()->json([
                'success' => true,
                'message' => 'Impuestos obtenidos exitosamente',
                'data' => [
                    'iva' => [
                        'porcentaje' => (float) $iva,
                        'valor_decimal' => $iva / 100
                    ],
                    'ice' => [
                        'porcentaje' => (float) $ice,
                        'valor_decimal' => $ice / 100
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener impuestos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update IVA percentage
     * Solo para administradores
     */
    public function actualizarIVA(Request $request)
    {
        try {
            // Verificar que es administrador
            if ($request->user()->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo administradores pueden actualizar el IVA'
                ], 403);
            }

            // Validar entrada
            $validated = $request->validate([
                'porcentaje' => 'required|numeric|min:0|max:100',
            ]);

            // Actualizar IVA
            Configuracion::establecer(
                'iva_porcentaje',
                $validated['porcentaje'],
                'numeric',
                'facturacion',
                'Porcentaje de IVA a aplicar en facturas'
            );

            return response()->json([
                'success' => true,
                'message' => 'IVA actualizado exitosamente',
                'data' => [
                    'porcentaje' => $validated['porcentaje'],
                    'valor_decimal' => $validated['porcentaje'] / 100
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar IVA: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update multiple settings at once
     * Recibe un array de { clave: valor } y actualiza todas las configuraciones
     */
    public function bulkUpdate(Request $request)
    {
        try {
            // Verificar que es administrador
            if ($request->user()->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo administradores pueden actualizar configuraciones'
                ], 403);
            }

            $validated = $request->validate([
                'settings' => 'required|array',
                'settings.*' => 'nullable',
            ]);

            $updated = [];
            $errors = [];

            foreach ($validated['settings'] as $clave => $valor) {
                try {
                    $configuracion = Configuracion::where('clave', $clave)->first();
                    
                    if (!$configuracion) {
                        // Crear nueva configuración si no existe
                        $configuracion = Configuracion::create([
                            'clave' => $clave,
                            'valor' => is_bool($valor) ? ($valor ? '1' : '0') : (string)$valor,
                            'tipo' => is_numeric($valor) ? 'numeric' : (is_bool($valor) ? 'boolean' : 'string'),
                            'grupo' => 'general',
                            'editable' => true,
                        ]);
                        $updated[] = $clave;
                        continue;
                    }

                    if (!$configuracion->editable) {
                        $errors[] = "La configuración '{$clave}' no es editable";
                        continue;
                    }

                    // Convertir booleanos a string para guardar
                    $valorGuardar = is_bool($valor) ? ($valor ? '1' : '0') : (string)$valor;
                    
                    $configuracion->update(['valor' => $valorGuardar]);
                    $updated[] = $clave;
                } catch (\Exception $e) {
                    $errors[] = "Error actualizando '{$clave}': " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => count($updated) . ' configuraciones actualizadas exitosamente',
                'data' => [
                    'updated' => $updated,
                    'errors' => $errors,
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuraciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload company logo
     */
    public function uploadLogo(Request $request)
    {
        try {
            // Verificar que es administrador
            if ($request->user()->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo administradores pueden subir el logo'
                ], 403);
            }

            $validated = $request->validate([
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            ]);

            // Eliminar logo anterior si existe
            $logoActual = Configuracion::obtener('logo_empresa');
            if ($logoActual) {
                $oldPath = str_replace('/storage/', '', $logoActual);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Guardar nuevo logo
            $file = $request->file('logo');
            $filename = 'logo_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('logos', $filename, 'public');
            
            $url = '/storage/' . $path;

            // Actualizar configuración
            Configuracion::establecer(
                'logo_empresa',
                $url,
                'string',
                'empresa',
                'URL del logo de la empresa'
            );

            return response()->json([
                'success' => true,
                'message' => 'Logo subido exitosamente',
                'data' => [
                    'url' => $url,
                    'full_url' => url($url),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete company logo
     */
    public function deleteLogo(Request $request)
    {
        try {
            // Verificar que es administrador
            if ($request->user()->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo administradores pueden eliminar el logo'
                ], 403);
            }

            // Obtener y eliminar logo actual
            $logoActual = Configuracion::obtener('logo_empresa');
            if ($logoActual) {
                $oldPath = str_replace('/storage/', '', $logoActual);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Limpiar configuración
            Configuracion::establecer(
                'logo_empresa',
                '',
                'string',
                'empresa',
                'URL del logo de la empresa'
            );

            return response()->json([
                'success' => true,
                'message' => 'Logo eliminado exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar logo: ' . $e->getMessage()
            ], 500);
        }
    }
}
