<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\Producto;
use App\Models\MovimientoInventario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoteController extends Controller
{
    // ============================================================
    // LISTAR TODOS LOS LOTES
    // ============================================================
    public function index(Request $request)
    {
        $query = Lote::with(['producto:producto_id,codigo_principal,nombre,imagen'])
            ->orderBy('fecha_ingreso', 'desc');

        // Filtrar por producto
        if ($request->has('producto_id')) {
            $query->where('producto_id', $request->producto_id);
        }

        // Filtrar por estado
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        // Filtrar solo con stock
        if ($request->boolean('con_stock')) {
            $query->where('cantidad_disponible', '>', 0);
        }

        // Filtrar próximos a vencer (30 días)
        if ($request->boolean('proximos_vencer')) {
            $query->whereNotNull('fecha_vencimiento')
                  ->where('fecha_vencimiento', '<=', now()->addDays(30))
                  ->where('fecha_vencimiento', '>', now());
        }

        // Filtrar vencidos
        if ($request->boolean('vencidos')) {
            $query->whereNotNull('fecha_vencimiento')
                  ->where('fecha_vencimiento', '<', now());
        }

        return response()->json($query->get());
    }

    // ============================================================
    // OBTENER LOTES DE UN PRODUCTO ESPECÍFICO
    // ============================================================
    public function lotesPorProducto($productoId)
    {
        $producto = Producto::findOrFail($productoId);

        $lotes = Lote::where('producto_id', $productoId)
            ->orderBy('fecha_ingreso', 'desc')
            ->get();

        return response()->json([
            'producto' => [
                'producto_id' => $producto->producto_id,
                'codigo_principal' => $producto->codigo_principal,
                'nombre' => $producto->nombre,
                'stock_actual' => $producto->stock_actual,
                'imagen' => $producto->imagen,
            ],
            'lotes' => $lotes,
            'resumen' => [
                'total_lotes' => $lotes->count(),
                'lotes_activos' => $lotes->where('estado', 'activo')->count(),
                'lotes_danados' => $lotes->where('estado', 'danado')->count(),
                'lotes_vencidos' => $lotes->where('estado', 'vencido')->count(),
                'stock_total_disponible' => $lotes->where('estado', 'activo')->sum('cantidad_disponible'),
            ],
        ]);
    }

    // ============================================================
    // DETALLE DE UN LOTE
    // ============================================================
    public function show($id)
    {
        $lote = Lote::with([
            'producto:producto_id,codigo_principal,nombre,imagen',
            'movimientos' => function($q) {
                $q->orderBy('fecha', 'desc')->limit(20);
            }
        ])->findOrFail($id);

        return response()->json($lote);
    }

    // ============================================================
    // DAR DE BAJA UN LOTE (DAÑADO)
    // ============================================================
    public function darDeBaja(Request $request, $id)
    {
        $request->validate([
            'motivo' => 'required|string|max:500',
            'cantidad' => 'nullable|integer|min:1',
        ]);

        $lote = Lote::findOrFail($id);

        if ($lote->estado !== 'activo') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden dar de baja lotes activos',
            ], 422);
        }

        $cantidad = $request->cantidad ?? $lote->cantidad_disponible;

        if ($cantidad > $lote->cantidad_disponible) {
            return response()->json([
                'success' => false,
                'message' => "Solo hay {$lote->cantidad_disponible} unidades disponibles en este lote",
            ], 422);
        }

        try {
            DB::beginTransaction();

            $lote->darDeBaja($request->motivo, $cantidad);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Se dieron de baja {$cantidad} unidades del lote {$lote->numero_lote}",
                'data' => $lote->fresh(['producto']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al dar de baja el lote: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // MARCAR LOTE COMO VENCIDO
    // ============================================================
    public function marcarVencido($id)
    {
        $lote = Lote::findOrFail($id);

        if ($lote->cantidad_disponible <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'El lote no tiene stock disponible',
            ], 422);
        }

        try {
            DB::beginTransaction();

            $cantidadAfectada = $lote->cantidad_disponible;

            // Registrar movimiento
            MovimientoInventario::create([
                'producto_id' => $lote->producto_id,
                'lote_id' => $lote->lote_id,
                'tipo_movimiento' => 'egreso',
                'motivo' => 'vencimiento',
                'cantidad' => $cantidadAfectada,
                'stock_anterior' => $lote->producto->stock_actual,
                'stock_nuevo' => $lote->producto->stock_actual - $cantidadAfectada,
                'costo_unitario' => $lote->costo_unitario,
                'referencia' => "Vencimiento Lote {$lote->numero_lote}",
                'fecha' => now(),
            ]);

            // Actualizar lote
            $lote->update([
                'cantidad_disponible' => 0,
                'estado' => 'vencido',
                'motivo_baja' => 'Producto vencido',
                'fecha_baja' => now(),
            ]);

            // Actualizar stock del producto
            $lote->producto->decrement('stock_actual', $cantidadAfectada);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Lote {$lote->numero_lote} marcado como vencido. Se descontaron {$cantidadAfectada} unidades.",
                'data' => $lote->fresh(['producto']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // CREAR LOTE MANUAL (SIN COMPRA)
    // ============================================================
    public function store(Request $request)
    {
        $request->validate([
            'producto_id' => 'required|exists:productos,producto_id',
            'cantidad' => 'required|integer|min:1',
            'costo_unitario' => 'required|numeric|min:0',
            'fecha_vencimiento' => 'nullable|date|after:today',
        ]);

        try {
            DB::beginTransaction();

            $producto = Producto::findOrFail($request->producto_id);
            $numeroLote = Lote::generarNumeroLote($request->producto_id);

            // Crear lote
            $lote = Lote::create([
                'producto_id' => $request->producto_id,
                'numero_lote' => $numeroLote,
                'cantidad_inicial' => $request->cantidad,
                'cantidad_disponible' => $request->cantidad,
                'costo_unitario' => $request->costo_unitario,
                'fecha_ingreso' => now(),
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'estado' => 'activo',
            ]);

            // Registrar movimiento de entrada
            MovimientoInventario::create([
                'producto_id' => $request->producto_id,
                'lote_id' => $lote->lote_id,
                'tipo_movimiento' => 'ingreso',
                'motivo' => 'ingreso_manual',
                'cantidad' => $request->cantidad,
                'stock_anterior' => $producto->stock_actual,
                'stock_nuevo' => $producto->stock_actual + $request->cantidad,
                'costo_unitario' => $request->costo_unitario,
                'referencia' => "Ingreso manual - Lote {$numeroLote}",
                'fecha' => now(),
            ]);

            // Actualizar stock
            $producto->increment('stock_actual', $request->cantidad);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Lote {$numeroLote} creado con {$request->cantidad} unidades",
                'data' => $lote->load('producto'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear lote: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // RESUMEN DE LOTES POR ESTADO
    // ============================================================
    public function resumen()
    {
        $lotes = Lote::with('producto:producto_id,nombre,codigo_principal')
            ->where('cantidad_disponible', '>', 0)
            ->get();

        // Productos próximos a vencer (30 días)
        $proximosVencer = $lotes->filter(function($lote) {
            return $lote->fecha_vencimiento && 
                   $lote->fecha_vencimiento->isAfter(now()) && 
                   $lote->fecha_vencimiento->diffInDays(now()) <= 30;
        });

        // Productos vencidos
        $vencidos = $lotes->filter(function($lote) {
            return $lote->fecha_vencimiento && $lote->fecha_vencimiento->isPast();
        });

        return response()->json([
            'total_lotes_activos' => $lotes->where('estado', 'activo')->count(),
            'total_stock_en_lotes' => $lotes->sum('cantidad_disponible'),
            'proximos_a_vencer' => [
                'count' => $proximosVencer->count(),
                'lotes' => $proximosVencer->values(),
            ],
            'vencidos' => [
                'count' => $vencidos->count(),
                'lotes' => $vencidos->values(),
            ],
        ]);
    }

    // ============================================================
    // HISTORIAL DE MOVIMIENTOS DE UN LOTE
    // ============================================================
    public function historial($id)
    {
        $lote = Lote::findOrFail($id);

        $movimientos = MovimientoInventario::where('lote_id', $id)
            ->orderBy('fecha', 'desc')
            ->orderBy('movimiento_id', 'desc')
            ->get();

        return response()->json([
            'lote' => $lote,
            'movimientos' => $movimientos,
        ]);
    }

    // ============================================================
    // SUGERIR SIGUIENTE NÚMERO DE LOTE PARA UN PRODUCTO
    // ============================================================
    public function sugerirSiguienteLote($productoId)
    {
        $producto = Producto::find($productoId);
        
        if (!$producto) {
            return response()->json([
                'sugerencia' => 'Lote 1',
                'ultimo_lote' => null,
                'total_lotes' => 0,
            ]);
        }

        // Obtener todos los lotes del producto
        $lotes = Lote::where('producto_id', $productoId)
            ->orderBy('lote_id', 'desc')
            ->get();

        if ($lotes->isEmpty()) {
            return response()->json([
                'sugerencia' => 'Lote 1',
                'ultimo_lote' => null,
                'total_lotes' => 0,
            ]);
        }

        $ultimoLote = $lotes->first();
        $ultimoNumero = $ultimoLote->numero_lote;

        // Intentar extraer el número del lote anterior para sugerir el siguiente
        // Patrones comunes: "Lote 1", "Lote 2", "LOTE-001", "L1", etc.
        
        $sugerencia = $this->generarSiguienteLote($ultimoNumero, $lotes->count());

        return response()->json([
            'sugerencia' => $sugerencia,
            'ultimo_lote' => $ultimoNumero,
            'total_lotes' => $lotes->count(),
            'lotes_existentes' => $lotes->pluck('numero_lote')->toArray(),
        ]);
    }

    /**
     * Generar siguiente número de lote basado en el patrón detectado
     */
    private function generarSiguienteLote($ultimoNumero, $totalLotes)
    {
        // Patrón 1: "Lote X" o "lote X"
        if (preg_match('/^(lote\s*)(\d+)$/i', $ultimoNumero, $matches)) {
            $prefijo = $matches[1];
            $numero = (int)$matches[2] + 1;
            return $prefijo . $numero;
        }

        // Patrón 2: "L-XXX" o "LOT-XXX"
        if (preg_match('/^([A-Za-z]+-?)(\d+)$/', $ultimoNumero, $matches)) {
            $prefijo = $matches[1];
            $numero = (int)$matches[2] + 1;
            $padding = strlen($matches[2]);
            return $prefijo . str_pad($numero, $padding, '0', STR_PAD_LEFT);
        }

        // Patrón 3: Solo números "001", "002"
        if (preg_match('/^(\d+)$/', $ultimoNumero, $matches)) {
            $numero = (int)$matches[1] + 1;
            $padding = strlen($matches[1]);
            return str_pad($numero, $padding, '0', STR_PAD_LEFT);
        }

        // Patrón 4: Texto + número al final "ProductoA1", "ProductoA2"
        if (preg_match('/^(.+?)(\d+)$/', $ultimoNumero, $matches)) {
            $prefijo = $matches[1];
            $numero = (int)$matches[2] + 1;
            return $prefijo . $numero;
        }

        // Si no coincide con ningún patrón, sugerir "Lote X" basado en total
        return 'Lote ' . ($totalLotes + 1);
    }
}
