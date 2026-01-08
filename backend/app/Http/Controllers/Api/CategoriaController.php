<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;

class CategoriaController extends Controller
{
    // LISTAR CATEGORÍAS
    public function index()
    {
        return Categoria::orderBy('categoria_id', 'DESC')->get();
    }

    // CREAR CATEGORÍA
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string'
        ]);

        Categoria::create($request->all());

        return response()->json([
            "message" => "Categoría creada correctamente"
        ], 201);
    }

    // ACTUALIZAR CATEGORÍA
    public function update(Request $request, $id)
    {
        $categoria = Categoria::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string'
        ]);

        $categoria->update($request->all());

        return response()->json([
            "message" => "Categoría actualizada correctamente"
        ]);
    }

    // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
    public function cambiarEstado($id)
    {
        $categoria = Categoria::findOrFail($id);

        try {
            $nuevoEstado = $categoria->estado === 'activo' ? 'inactivo' : 'activo';
            $categoria->estado = $nuevoEstado;
            $categoria->save();

            return response()->json([
                "success" => true,
                "message" => $nuevoEstado === 'activo' ? "Categoría activada correctamente" : "Categoría desactivada correctamente",
                "data" => $categoria
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => "Error al cambiar estado: " . $e->getMessage()
            ], 500);
        }
    }

    // ELIMINAR CATEGORÍA
    public function destroy($id, Request $request)
    {
        $categoria = Categoria::findOrFail($id);
        $forzar = $request->query('forzar', false);

        try {
            DB::beginTransaction();

            // Verificar si tiene productos asociados
            $tieneProductos = Producto::where('categoria_id', $id)->exists();

            if ($tieneProductos && !$forzar) {
                return response()->json([
                    "success" => false,
                    "message" => "No se puede eliminar la categoría porque tiene productos asociados. Considere desactivarla en su lugar.",
                    "tiene_relaciones" => true
                ], 422);
            }

            // Si forzar está activo, quitar la categoría de los productos
            if ($forzar) {
                Producto::where('categoria_id', $id)->update(['categoria_id' => null]);
            }

            $categoria->delete();

            DB::commit();

            return response()->json([
                "success" => true,
                "message" => "Categoría eliminada correctamente"
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "success" => false,
                "message" => "Error al eliminar categoría: " . $e->getMessage()
            ], 500);
        }
    }
}
