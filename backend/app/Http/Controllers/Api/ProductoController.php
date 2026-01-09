<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Lote;
use App\Models\MovimientoInventario;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    // ============================================================
    // LISTAR PRODUCTOS CON CATEGORÍA Y LOTES
    // ============================================================
    public function index()
    {
        $productos = Producto::with(['categoria', 'proveedorPrincipal', 'lotes' => function($query) {
            $query->where('estado', 'activo')
                  ->where('cantidad_disponible', '>', 0)
                  ->orderBy('fecha_vencimiento', 'asc');
        }])->orderBy('producto_id', 'DESC')->get();

        // Agregar información de próximo vencimiento
        $productos->transform(function($producto) {
            $loteProximo = $producto->lotes->whereNotNull('fecha_vencimiento')->first();
            $producto->proximo_vencimiento = $loteProximo?->fecha_vencimiento;
            $producto->lote_proximo = $loteProximo?->numero_lote;
            
            // Fecha del último ingreso
            $ultimoLote = $producto->lotes->sortByDesc('fecha_ingreso')->first();
            $producto->ultimo_ingreso = $ultimoLote?->fecha_ingreso;
            
            return $producto;
        });

        return response()->json($productos, 200);
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
            'iva_porcentaje'   => 'nullable|numeric|min:0|max:100',
            'ice_porcentaje'   => 'nullable|numeric|min:0|max:100',
            'imagen'           => 'nullable|image|max:4096',
            'numero_lote'      => 'nullable|string|max:50', // Lote inicial opcional
            'fecha_vencimiento' => 'nullable|date|after_or_equal:today', // Fecha de caducidad
            // Campos de identificación y control
            'unidad_medida'        => 'nullable|in:unidad,kg,lb,caja,paquete,litro,metro,docena',
            'marca'                => 'nullable|string|max:100',
            'proveedor_principal_id' => 'nullable|exists:proveedores,proveedor_id',
            'sku'                  => 'nullable|string|max:50|unique:productos,sku',
            'ubicacion_bodega'     => 'nullable|string|max:100',
            // Configuración de precios
            'margen_ganancia'      => 'nullable|numeric|min:0|max:1000',
            'modo_precio'          => 'nullable|in:automatico,manual',
        ]);

        DB::beginTransaction();

        try {
            $producto = new Producto($request->only([
                'codigo_principal', 'codigo_barras', 'nombre', 'descripcion',
                'precio_costo', 'precio_unitario', 'stock_actual', 'categoria_id',
                'iva_aplica', 'ice_aplica', 'iva_porcentaje', 'ice_porcentaje',
                'unidad_medida', 'marca', 'proveedor_principal_id', 'sku', 'ubicacion_bodega',
                'margen_ganancia', 'modo_precio'
            ]));

            // Establecer costo promedio inicial = precio_costo
            $producto->costo_promedio = $request->precio_costo ?: 0;

            // Calcular precio_con_impuestos automáticamente
            $precioBase = (float)$request->precio_unitario;
            $ivaPorcentaje = $request->iva_aplica ? ((float)$request->iva_porcentaje ?: 15) : 0;
            $icePorcentaje = $request->ice_aplica ? ((float)$request->ice_porcentaje ?: 0) : 0;
            $producto->precio_con_impuestos = $precioBase * (1 + ($ivaPorcentaje + $icePorcentaje) / 100);

            // Guardar imagen
            if ($request->hasFile('imagen')) {
                $ruta = $request->file('imagen')->store('productos', 'public');
                $producto->imagen = $ruta;
            }

            $producto->save();

            // ========== CREAR LOTE INICIAL SI HAY STOCK ==========
            $stockInicial = (int) $request->stock_actual;
            if ($stockInicial > 0) {
                // Usar número de lote personalizado o generar automáticamente
                $numeroLote = !empty($request->numero_lote) 
                    ? $request->numero_lote 
                    : Lote::generarNumeroLote($producto->producto_id);

                // Fecha de vencimiento (puede ser null)
                $fechaVencimiento = $request->fecha_vencimiento ?: null;

                $lote = Lote::create([
                    'producto_id' => $producto->producto_id,
                    'numero_lote' => $numeroLote,
                    'cantidad_inicial' => $stockInicial,
                    'cantidad_disponible' => $stockInicial,
                    'costo_unitario' => (float) ($request->precio_costo ?: $request->precio_unitario),
                    'fecha_ingreso' => now()->toDateString(),
                    'fecha_vencimiento' => $fechaVencimiento,
                    'estado' => 'activo',
                    'compra_id' => null, // No viene de compra, es inventario inicial
                ]);

                // Registrar movimiento de inventario inicial
                MovimientoInventario::create([
                    'fecha' => now(),
                    'tipo_movimiento' => 'ENTRADA',
                    'tipo_documento' => 'INVENTARIO_INICIAL',
                    'numero_documento' => $producto->producto_id,
                    'cantidad' => $stockInicial,
                    'cantidad_entrada' => $stockInicial,
                    'cantidad_salida' => 0,
                    'stock_resultante' => $stockInicial,
                    'costo_unitario' => (float) ($request->precio_costo ?: $request->precio_unitario),
                    'lote_id' => $lote->lote_id,
                    'referencia' => 'Inventario inicial - Producto: ' . $producto->nombre,
                    'producto_id' => $producto->producto_id,
                    'usuario_id' => $request->user()?->usuario_id ?? null,
                    'observaciones' => 'Creación de producto con stock inicial' . 
                        ($request->numero_lote ? ' - Lote: ' . $request->numero_lote : '') .
                        ($fechaVencimiento ? ' - Vence: ' . $fechaVencimiento : ''),
                ]);
            }

            DB::commit();

            return response()->json([
                "success" => true,
                "message" => "Producto creado correctamente" . ($stockInicial > 0 ? " con lote inicial" : ""),
                "data"    => $producto->load('categoria')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "success" => false,
                "message" => "Error al crear producto: " . $e->getMessage()
            ], 500);
        }
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
            'iva_porcentaje'   => 'nullable|numeric|min:0|max:100',
            'ice_porcentaje'   => 'nullable|numeric|min:0|max:100',
            'imagen'           => 'nullable|image|max:4096',
            // Campos de identificación y control
            'unidad_medida'        => 'nullable|in:unidad,kg,lb,caja,paquete,litro,metro,docena',
            'marca'                => 'nullable|string|max:100',
            'proveedor_principal_id' => 'nullable|exists:proveedores,proveedor_id',
            'sku'                  => "nullable|string|max:50|unique:productos,sku,{$id},producto_id",
            'ubicacion_bodega'     => 'nullable|string|max:100',
            // Configuración de precios
            'margen_ganancia'      => 'nullable|numeric|min:0|max:1000',
            'modo_precio'          => 'nullable|in:automatico,manual',
        ]);

        // Actualizar campos
        $producto->fill($request->only([
            'codigo_principal', 'codigo_barras', 'nombre', 'descripcion',
            'precio_costo', 'precio_unitario', 'stock_actual', 'categoria_id',
            'iva_aplica', 'ice_aplica', 'iva_porcentaje', 'ice_porcentaje',
            'unidad_medida', 'marca', 'proveedor_principal_id', 'sku', 'ubicacion_bodega',
            'margen_ganancia', 'modo_precio'
        ]));

        // Calcular precio_con_impuestos automáticamente
        $precioBase = (float)$request->precio_unitario;
        $ivaPorcentaje = $request->iva_aplica ? ((float)$request->iva_porcentaje ?: 15) : 0;
        $icePorcentaje = $request->ice_aplica ? ((float)$request->ice_porcentaje ?: 0) : 0;
        $producto->precio_con_impuestos = $precioBase * (1 + ($ivaPorcentaje + $icePorcentaje) / 100);

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
    // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
    // ============================================================
    public function cambiarEstado($id)
    {
        $producto = Producto::findOrFail($id);

        try {
            $nuevoEstado = $producto->estado === 'activo' ? 'inactivo' : 'activo';
            $producto->estado = $nuevoEstado;
            $producto->save();

            return response()->json([
                "success" => true,
                "message" => $nuevoEstado === 'activo' ? "Producto activado correctamente" : "Producto desactivado correctamente",
                "data" => $producto->load('categoria')
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                "success" => false,
                "message" => "Error al cambiar estado: " . $e->getMessage()
            ], 500);
        }
    }

    // ============================================================
    // ELIMINAR PRODUCTO
    // ============================================================
    public function destroy($id, Request $request)
    {
        $producto = Producto::findOrFail($id);
        $forzar = $request->query('forzar', false);

        try {
            DB::beginTransaction();

            // Verificar si tiene facturas o compras asociadas
            $tieneFacturas = \App\Models\DetalleFactura::where('producto_id', $id)->exists();
            $tieneCompras = \App\Models\DetalleCompra::where('producto_id', $id)->exists();
            $tieneEgresos = \App\Models\DetalleEgreso::where('producto_id', $id)->exists();

            if (($tieneFacturas || $tieneCompras || $tieneEgresos) && !$forzar) {
                return response()->json([
                    "success" => false,
                    "message" => "No se puede eliminar el producto porque tiene ventas, compras o egresos registrados. Considere desactivarlo en su lugar.",
                    "tiene_relaciones" => true
                ], 422);
            }

            // Si forzar está activo, eliminar las relaciones primero
            if ($forzar) {
                // Eliminar detalles de factura
                \App\Models\DetalleFactura::where('producto_id', $id)->delete();

                // Eliminar detalles de compra y compras vacías
                $comprasAfectadas = \App\Models\DetalleCompra::where('producto_id', $id)
                    ->pluck('compra_id')
                    ->unique();
                \App\Models\DetalleCompra::where('producto_id', $id)->delete();
                
                // Eliminar compras que quedaron sin detalles
                foreach ($comprasAfectadas as $compraId) {
                    $tieneOtrosDetalles = \App\Models\DetalleCompra::where('compra_id', $compraId)->exists();
                    if (!$tieneOtrosDetalles) {
                        \App\Models\Compra::where('compra_id', $compraId)->delete();
                    }
                }

                // Eliminar detalles de egreso y egresos vacíos
                $egresosAfectados = \App\Models\DetalleEgreso::where('producto_id', $id)
                    ->pluck('egreso_id')
                    ->unique();
                \App\Models\DetalleEgreso::where('producto_id', $id)->delete();
                
                // Eliminar egresos que quedaron sin detalles
                foreach ($egresosAfectados as $egresoId) {
                    $tieneOtrosDetalles = \App\Models\DetalleEgreso::where('egreso_id', $egresoId)->exists();
                    if (!$tieneOtrosDetalles) {
                        \App\Models\Egreso::where('egreso_id', $egresoId)->delete();
                    }
                }
            }

            // Eliminar movimientos de inventario asociados
            MovimientoInventario::where('producto_id', $id)->delete();

            // Eliminar lotes asociados
            Lote::where('producto_id', $id)->delete();

            // Eliminar imagen física
            if ($producto->imagen && Storage::disk('public')->exists($producto->imagen)) {
                Storage::disk('public')->delete($producto->imagen);
            }

            $producto->delete();

            DB::commit();

            return response()->json([
                "success" => true,
                "message" => "Producto eliminado correctamente junto con sus registros de compras y egresos"
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                "success" => false,
                "message" => "Error al eliminar producto: " . $e->getMessage()
            ], 500);
        }
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
                'numero_lote' => $row['numero_lote'] ?? null,
                'fecha_vencimiento' => $row['fecha_vencimiento'] ?? null,
                'margen_ganancia' => $row['margen_ganancia'] ?? null,
                'modo_precio' => $row['modo_precio'] ?? null,
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

        DB::beginTransaction();

        try {
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

                    $stockActual = (int)($row['stock_actual'] ?? 0);
                    $numeroLote = $row['numero_lote'] ?? null;

                    // Procesar margen y modo de precio
                    $margenGanancia = isset($row['margen_ganancia']) && $row['margen_ganancia'] !== '' 
                        ? (float)$row['margen_ganancia'] 
                        : 30.00;
                    $modoPrecio = isset($row['modo_precio']) && in_array($row['modo_precio'], ['automatico', 'manual']) 
                        ? $row['modo_precio'] 
                        : 'automatico';

                    $payload = [
                        'codigo_principal' => $row['codigo_principal'] ?? null,
                        'codigo_barras' => $row['codigo_barras'] ?? null,
                        'nombre' => $row['nombre'] ?? null,
                        'descripcion' => $row['descripcion'] ?? null,
                        'precio_costo' => (float)($row['precio_costo'] ?? 0),
                        'precio_unitario' => (float)($row['precio_unitario'] ?? 0),
                        'stock_actual' => $stockActual,
                        'categoria_id' => $categoriaId,
                        'iva_aplica' => isset($row['iva_aplica']) ? (int)$row['iva_aplica'] : 0,
                        'ice_aplica' => isset($row['ice_aplica']) ? (int)$row['ice_aplica'] : 0,
                        'margen_ganancia' => $margenGanancia,
                        'modo_precio' => $modoPrecio,
                    ];

                    // Validación simple
                    if (!$payload['codigo_principal'] || !$payload['nombre']) {
                        throw new \Exception('Campos obligatorios faltantes');
                    }

                    // Crear o actualizar por código
                    $producto = Producto::where('codigo_principal', $payload['codigo_principal'])->first();
                    $esNuevo = false;

                    if ($producto) {
                        // Si es actualización, no modificar stock desde aquí
                        $payloadSinStock = $payload;
                        unset($payloadSinStock['stock_actual']);
                        $producto->update($payloadSinStock);
                        $updated++;
                    } else {
                        $producto = Producto::create($payload);
                        $esNuevo = true;
                        $created++;
                    }

                    // ========== CREAR LOTE INICIAL SI ES NUEVO Y TIENE STOCK ==========
                    if ($esNuevo && $stockActual > 0) {
                        // Usar número de lote del CSV o generar automáticamente
                        $loteNumero = !empty($numeroLote) 
                            ? $numeroLote 
                            : Lote::generarNumeroLote($producto->producto_id);

                        // Procesar fecha de vencimiento si viene en el CSV
                        $fechaVencimiento = null;
                        if (!empty($row['fecha_vencimiento'])) {
                            try {
                                $fechaVencimiento = \Carbon\Carbon::parse($row['fecha_vencimiento'])->toDateString();
                            } catch (\Exception $e) {
                                $fechaVencimiento = null;
                            }
                        }

                        $lote = Lote::create([
                            'producto_id' => $producto->producto_id,
                            'numero_lote' => $loteNumero,
                            'cantidad_inicial' => $stockActual,
                            'cantidad_disponible' => $stockActual,
                            'costo_unitario' => (float) ($payload['precio_costo'] ?: $payload['precio_unitario']),
                            'fecha_ingreso' => now()->toDateString(),
                            'fecha_vencimiento' => $fechaVencimiento,
                            'estado' => 'activo',
                            'compra_id' => null,
                        ]);

                        // Registrar movimiento de inventario inicial
                        MovimientoInventario::create([
                            'fecha' => now(),
                            'tipo_movimiento' => 'ENTRADA',
                            'tipo_documento' => 'IMPORTACION_CSV',
                            'numero_documento' => $producto->producto_id,
                            'cantidad' => $stockActual,
                            'cantidad_entrada' => $stockActual,
                            'cantidad_salida' => 0,
                            'stock_resultante' => $stockActual,
                            'costo_unitario' => (float) ($payload['precio_costo'] ?: $payload['precio_unitario']),
                            'lote_id' => $lote->lote_id,
                            'referencia' => 'Importación CSV - Producto: ' . $producto->nombre,
                            'producto_id' => $producto->producto_id,
                            'usuario_id' => $request->user()?->usuario_id ?? null,
                            'observaciones' => 'Stock inicial por importación masiva' . ($numeroLote ? ' - Lote: ' . $numeroLote : ''),
                        ]);
                    }

                } catch (\Throwable $e) {
                    $errors[] = [
                        'index' => $idx,
                        'codigo_principal' => $row['codigo_principal'] ?? null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Importación procesada',
                'created' => $created,
                'updated' => $updated,
                'errors' => $errors,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error en importación: ' . $e->getMessage(),
                'created' => 0,
                'updated' => 0,
                'errors' => $errors,
            ], 500);
        }
    }

    // Helper para normalizar valores booleanos desde CSV
    private static function normalizeBool($value)
    {
        if (is_numeric($value)) return (int)$value; // 0/1
        $v = strtolower(trim((string)$value));
        return in_array($v, ['1','true','sí','si','y','yes']) ? 1 : 0;
    }
}
