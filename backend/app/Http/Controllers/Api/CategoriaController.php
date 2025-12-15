<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Categoria;

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

    // ELIMINAR CATEGORÍA
    public function destroy($id)
    {
        $categoria = Categoria::findOrFail($id);
        $categoria->delete();

        return response()->json(["message" => "Categoría eliminada"]);
    }
}
