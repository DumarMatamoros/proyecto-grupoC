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

        $data = $request->all();
        $data['estado'] = 'activo'; // Asegurar estado activo por defecto

        Categoria::create($data);

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

    // ============================================================
    // IMPORTACIÓN MASIVA - PREVISUALIZAR (CSV)
    // ============================================================
    public function importPreview(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('archivo');
        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return response()->json(["message" => "No se pudo leer el archivo"], 422);
        }

        // Leer encabezados
        $headers = fgetcsv($handle, 0, ',', '"');
        if (!$headers) {
            return response()->json(["message" => "El CSV no contiene encabezados"], 422);
        }

        // Normalizar encabezados
        $normalize = function ($h) {
            $h = preg_replace('/^\xEF\xBB\xBF/', '', $h); // quitar BOM UTF-8
            $h = strtolower(trim($h));
            $h = str_replace([' ', '-'], '_', $h);
            $h = strtr($h, [
                'á' => 'a','é' => 'e','í' => 'i','ó' => 'o','ú' => 'u','ñ' => 'n',
            ]);
            return $h;
        };
        $headers = array_map($normalize, $headers);

        $rows = [];
        $line = 1;
        while (($data = fgetcsv($handle, 0, ',', '"')) !== false && count($rows) < 1000) {
            // Ignorar líneas vacías
            if ($data === null || (count($data) === 1 && trim((string)$data[0]) === '')) {
                continue;
            }

            // Asegurar mismas longitudes
            if (count($data) < count($headers)) {
                $data = array_merge($data, array_fill(0, count($headers) - count($data), null));
            } elseif (count($data) > count($headers)) {
                $data = array_slice($data, 0, count($headers));
            }

            $data = array_map(function($v){ return is_string($v) ? trim($v) : $v; }, $data);
            $row = array_combine($headers, $data);

            $rows[] = [
                'nombre' => $row['nombre'] ?? null,
                'descripcion' => $row['descripcion'] ?? null,
                'linea' => $line + 1,
            ];
            $line++;
        }
        fclose($handle);

        return response()->json([
            'headers' => $headers,
            'preview' => $rows,
            'count' => count($rows),
        ], 200);
    }

    // ============================================================
    // IMPORTACIÓN MASIVA - CONFIRMAR (CSV)
    // ============================================================
    public function importConfirm(Request $request)
    {
        $request->validate([
            'rows' => 'required|array',
        ]);

        $created = 0;
        $updated = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($request->input('rows') as $idx => $row) {
                $nombre = $row['nombre'] ?? null;
                $descripcion = $row['descripcion'] ?? null;

                if (empty($nombre)) {
                    $errors[] = [
                        'linea' => $row['linea'] ?? $idx + 1,
                        'error' => 'El nombre es obligatorio'
                    ];
                    continue;
                }

                // Buscar si existe por nombre
                $categoria = Categoria::where('nombre', $nombre)->first();

                if ($categoria) {
                    // Actualizar
                    $categoria->update([
                        'descripcion' => $descripcion,
                    ]);
                    $updated++;
                } else {
                    // Crear nueva
                    Categoria::create([
                        'nombre' => $nombre,
                        'descripcion' => $descripcion,
                        'estado' => 'activo',
                    ]);
                    $created++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'created' => $created,
                'updated' => $updated,
                'errors' => $errors,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error en la importación: ' . $e->getMessage(),
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
