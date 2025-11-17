<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Producto;
use Illuminate\Support\Facades\Storage;

class ProductoController extends Controller
{
    // ============================================================
    // LISTAR PRODUCTOS CON CATEGORÍA
    // ============================================================
    public function index()
    {
        return response()->json(
            Producto::with('categoria')
                ->orderBy('producto_id', 'DESC')
                ->get(),
            200
        );
    }

    // ============================================================
    // CREAR PRODUCTO
    // ============================================================
    public function store(Request $request)
    {
        $request->validate([
            'codigo_principal' => 'required|unique:productos,codigo_principal',
            'nombre'           => 'required|max:255',
            'descripcion'      => 'nullable|string',
            'precio_unitario'  => 'required|numeric|min:0',
            'stock_actual'     => 'required|integer|min:0',
            'categoria_id'     => 'nullable|exists:categorias,categoria_id',
            'iva_aplica'       => 'required|in:0,1',
            'ice_aplica'       => 'required|in:0,1',
            'imagen'           => 'nullable|image|max:4096',
        ]);

        $producto = new Producto($request->only([
            'codigo_principal', 'nombre', 'descripcion',
            'precio_unitario', 'stock_actual', 'categoria_id',
            'iva_aplica', 'ice_aplica'
        ]));

        // Guardar imagen
        if ($request->hasFile('imagen')) {
            $ruta = $request->file('imagen')->store('productos', 'public');
            $producto->imagen = $ruta;
        }

        $producto->save();

        return response()->json([
            "success" => true,
            "message" => "Producto creado correctamente",
            "data"    => $producto->load('categoria')
        ], 201);
    }

    // ============================================================
    // ACTUALIZAR PRODUCTO
    // ============================================================
    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $request->validate([
            'codigo_principal' => "required|unique:productos,codigo_principal,{$id},producto_id",
            'nombre'           => 'required|max:255',
            'descripcion'      => 'nullable|string',
            'precio_unitario'  => 'required|numeric|min:0',
            'stock_actual'     => 'required|integer|min:0',
            'categoria_id'     => 'nullable|exists:categorias,categoria_id',
            'iva_aplica'       => 'required|in:0,1',
            'ice_aplica'       => 'required|in:0,1',
            'imagen'           => 'nullable|image|max:4096',
        ]);

        // Actualizar campos
        $producto->fill($request->only([
            'codigo_principal', 'nombre', 'descripcion',
            'precio_unitario', 'stock_actual', 'categoria_id',
            'iva_aplica', 'ice_aplica'
        ]));

        // Si llega nueva imagen → reemplazar
        if ($request->hasFile('imagen')) {

            // Borrar imagen anterior
            if ($producto->imagen && Storage::disk('public')->exists($producto->imagen)) {
                Storage::disk('public')->delete($producto->imagen);
            }

            $ruta = $request->file('imagen')->store('productos', 'public');
            $producto->imagen = $ruta;
        }

        $producto->save();

        return response()->json([
            "success" => true,
            "message" => "Producto actualizado correctamente",
            "data"    => $producto->load('categoria')
        ], 200);
    }

    // ============================================================
    // ELIMINAR PRODUCTO
    // ============================================================
    public function destroy($id)
    {
        $producto = Producto::findOrFail($id);

        // Eliminar imagen física
        if ($producto->imagen && Storage::disk('public')->exists($producto->imagen)) {
            Storage::disk('public')->delete($producto->imagen);
        }

        $producto->delete();

        return response()->json([
            "success" => true,
            "message" => "Producto eliminado correctamente"
        ], 200);
    }
}
