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
            'codigo_principal' => 'required|unique:productos,codigo_principal|max:100',
            'codigo_barras'    => 'nullable|string|max:100',
            'nombre'           => 'required|max:500',
            'descripcion'      => 'nullable|string|max:2000',
            'precio_costo'     => 'nullable|numeric|min:0',
            'precio_unitario'  => 'required|numeric|min:0',
            'stock_actual'     => 'required|integer|min:0',
            'categoria_id'     => 'nullable|exists:categorias,categoria_id',
            'iva_aplica'       => 'required|in:0,1',
            'ice_aplica'       => 'required|in:0,1',
            'imagen'           => 'nullable|image|max:4096',
        ]);

        $producto = new Producto($request->only([
            'codigo_principal', 'codigo_barras', 'nombre', 'descripcion',
            'precio_costo', 'precio_unitario', 'stock_actual', 'categoria_id',
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
            'codigo_principal' => "required|unique:productos,codigo_principal,{$id},producto_id|max:100",
            'codigo_barras'    => 'nullable|string|max:100',
            'nombre'           => 'required|max:500',
            'descripcion'      => 'nullable|string|max:2000',
            'precio_costo'     => 'nullable|numeric|min:0',
            'precio_unitario'  => 'required|numeric|min:0',
            'stock_actual'     => 'required|integer|min:0',
            'categoria_id'     => 'nullable|exists:categorias,categoria_id',
            'iva_aplica'       => 'required|in:0,1',
            'ice_aplica'       => 'required|in:0,1',
            'imagen'           => 'nullable|image|max:4096',
        ]);

        // Actualizar campos
        $producto->fill($request->only([
            'codigo_principal', 'codigo_barras', 'nombre', 'descripcion',
            'precio_costo', 'precio_unitario', 'stock_actual', 'categoria_id',
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

    // ============================================================
    // IMPORTACIÓN MASIVA - PREVISUALIZACIÓN (CSV)
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

        // Leer encabezados usando delimitador coma y manejo de comillas
        $headers = fgetcsv($handle, 0, ',', '"');
        if (!$headers) {
            return response()->json(["message" => "El CSV no contiene encabezados"], 422);
        }

        // Normalizar encabezados: quitar BOM, espacios, acentos y sustituir por guiones bajos
        $normalize = function ($h) {
            $h = preg_replace('/^\xEF\xBB\xBF/', '', $h); // quitar BOM UTF-8 si existe
            $h = strtolower(trim($h));
            $h = str_replace([' ', '-'], '_', $h);
            // reemplazar acentos comunes
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

            // Asegurar mismas longitudes: rellenar o truncar
            if (count($data) < count($headers)) {
                $data = array_merge($data, array_fill(0, count($headers) - count($data), null));
            } elseif (count($data) > count($headers)) {
                $data = array_slice($data, 0, count($headers));
            }

            // Trim de cada valor
            $data = array_map(function($v){ return is_string($v) ? trim($v) : $v; }, $data);
            $row = array_combine($headers, $data);

            // Campos esperados
            // Resolver alias para codigo_principal
            $codigo = $row['codigo_principal']
                ?? $row['codigo']
                ?? $row['codigo_producto']
                ?? $row['code']
                ?? null;
            $rows[] = [
                'codigo_principal' => $codigo,
                'codigo_barras' => $row['codigo_barras'] ?? null,
                'nombre' => $row['nombre'] ?? null,
                'descripcion' => $row['descripcion'] ?? null,
                'precio_costo' => $row['precio_costo'] ?? null,
                'precio_unitario' => $row['precio_unitario'] ?? null,
                'stock_actual' => $row['stock_actual'] ?? null,
                'categoria_nombre' => $row['categoria_nombre'] ?? ($row['categoria'] ?? null),
                'iva_aplica' => isset($row['iva_aplica']) ? (int)self::normalizeBool($row['iva_aplica']) : 0,
                'ice_aplica' => isset($row['ice_aplica']) ? (int)self::normalizeBool($row['ice_aplica']) : 0,
                'imagen_url' => $row['imagen_url'] ?? null,
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

        foreach ($request->input('rows') as $idx => $row) {
            try {
                // Resolver categoría por nombre si se envía
                $categoriaId = null;
                if (!empty($row['categoria_nombre'])) {
                    $categoria = \App\Models\Categoria::firstOrCreate([
                        'nombre' => $row['categoria_nombre']
                    ], [
                        'descripcion' => $row['categoria_nombre']
                    ]);
                    $categoriaId = $categoria->categoria_id;
                }

                $payload = [
                    'codigo_principal' => $row['codigo_principal'] ?? null,
                    'codigo_barras' => $row['codigo_barras'] ?? null,
                    'nombre' => $row['nombre'] ?? null,
                    'descripcion' => $row['descripcion'] ?? null,
                    'precio_costo' => (float)($row['precio_costo'] ?? 0),
                    'precio_unitario' => (float)($row['precio_unitario'] ?? 0),
                    'stock_actual' => (int)($row['stock_actual'] ?? 0),
                    'categoria_id' => $categoriaId,
                    'iva_aplica' => isset($row['iva_aplica']) ? (int)$row['iva_aplica'] : 0,
                    'ice_aplica' => isset($row['ice_aplica']) ? (int)$row['ice_aplica'] : 0,
                ];

                // Validación simple
                if (!$payload['codigo_principal'] || !$payload['nombre']) {
                    throw new \Exception('Campos obligatorios faltantes');
                }

                // Crear o actualizar por código
                $producto = Producto::where('codigo_principal', $payload['codigo_principal'])->first();
                if ($producto) {
                    $producto->update($payload);
                    $updated++;
                } else {
                    $producto = Producto::create($payload);
                    $created++;
                }
            } catch (\Throwable $e) {
                $errors[] = [
                    'index' => $idx,
                    'codigo_principal' => $row['codigo_principal'] ?? null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'message' => 'Importación procesada',
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
        ], 200);
    }

    // Helper para normalizar valores booleanos desde CSV
    private static function normalizeBool($value)
    {
        if (is_numeric($value)) return (int)$value; // 0/1
        $v = strtolower(trim((string)$value));
        return in_array($v, ['1','true','sí','si','y','yes']) ? 1 : 0;
    }
}
