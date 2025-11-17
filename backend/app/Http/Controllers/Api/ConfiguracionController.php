<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use Illuminate\Http\Request;

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
}
