<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lote extends Model
{
    protected $table = 'lotes';
    protected $primaryKey = 'lote_id';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'producto_id',
        'numero_lote',
        'cantidad_inicial',
        'cantidad_disponible',
        'costo_unitario',
        'fecha_ingreso',
        'fecha_vencimiento',
        'estado',
        'motivo_baja',
        'fecha_baja',
        'compra_id',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_vencimiento' => 'date',
        'fecha_baja' => 'datetime',
        'costo_unitario' => 'decimal:2',
    ];

    // Estados posibles
    const ESTADO_ACTIVO = 'activo';
    const ESTADO_AGOTADO = 'agotado';
    const ESTADO_DANADO = 'danado';
    const ESTADO_VENCIDO = 'vencido';

    // ==================== RELACIONES ====================

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id', 'producto_id');
    }

    public function movimientos()
    {
        return $this->hasMany(MovimientoInventario::class, 'lote_id', 'lote_id');
    }

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'compra_id', 'compra_id');
    }

    // ==================== SCOPES ====================

    public function scopeActivos($query)
    {
        return $query->where('estado', self::ESTADO_ACTIVO);
    }

    public function scopeConStock($query)
    {
        return $query->where('cantidad_disponible', '>', 0);
    }

    public function scopeNoVencidos($query)
    {
        return $query->where(function($q) {
            $q->whereNull('fecha_vencimiento')
              ->orWhere('fecha_vencimiento', '>', now());
        });
    }

    // ==================== MÉTODOS FIFO ====================

    /**
     * Obtener el lote más antiguo con stock disponible (FIFO)
     */
    public static function obtenerLoteFIFO($productoId)
    {
        return self::where('producto_id', $productoId)
            ->activos()
            ->conStock()
            ->noVencidos()
            ->orderBy('fecha_ingreso', 'asc')
            ->orderBy('lote_id', 'asc')
            ->first();
    }

    /**
     * Generar número de lote automático para un producto
     */
    public static function generarNumeroLote($productoId): string
    {
        $ultimoLote = self::where('producto_id', $productoId)
            ->orderBy('lote_id', 'desc')
            ->first();

        $numeroSecuencial = $ultimoLote ? ((int)preg_replace('/\D/', '', $ultimoLote->numero_lote) + 1) : 1;
        
        return 'L-' . str_pad($numeroSecuencial, 4, '0', STR_PAD_LEFT);
    }

    // ==================== MÉTODOS DE ESTADO ====================

    /**
     * Verificar si el lote está vencido
     */
    public function estaVencido(): bool
    {
        if (!$this->fecha_vencimiento) return false;
        return $this->fecha_vencimiento->isPast();
    }

    /**
     * Verificar si el lote está próximo a vencer (30 días)
     */
    public function proximoAVencer(int $dias = 30): bool
    {
        if (!$this->fecha_vencimiento) return false;
        return $this->fecha_vencimiento->diffInDays(now()) <= $dias;
    }

    /**
     * Dar de baja el lote por daño
     */
    public function darDeBaja(string $motivo, int $cantidadAfectada = null): void
    {
        $cantidadADescontar = $cantidadAfectada ?? $this->cantidad_disponible;
        $stockActual = $this->producto->stock_actual;
        
        // Registrar movimiento de egreso
        MovimientoInventario::create([
            'producto_id' => $this->producto_id,
            'lote_id' => $this->lote_id,
            'tipo_movimiento' => 'SALIDA',
            'tipo_documento' => 'BAJA_LOTE',
            'numero_documento' => $this->lote_id,
            'cantidad' => $cantidadADescontar,
            'cantidad_entrada' => 0,
            'cantidad_salida' => $cantidadADescontar,
            'stock_resultante' => $stockActual - $cantidadADescontar,
            'costo_unitario' => $this->costo_unitario,
            'referencia' => "Baja Lote {$this->numero_lote}: {$motivo}",
            'fecha' => now(),
            'observaciones' => $motivo,
        ]);

        // Actualizar lote
        $this->cantidad_disponible -= $cantidadADescontar;
        $this->motivo_baja = $motivo;
        $this->fecha_baja = now();
        
        if ($this->cantidad_disponible <= 0) {
            $this->estado = self::ESTADO_DANADO;
        }
        
        $this->save();

        // Actualizar stock del producto
        $this->producto->decrement('stock_actual', $cantidadADescontar);
    }

    // ==================== ATRIBUTOS CALCULADOS ====================

    /**
     * Obtener etiqueta de estado con color
     */
    public function getEstadoInfoAttribute(): array
    {
        $estados = [
            'activo' => ['label' => 'Activo', 'color' => 'green'],
            'agotado' => ['label' => 'Agotado', 'color' => 'gray'],
            'danado' => ['label' => 'Dañado', 'color' => 'red'],
            'vencido' => ['label' => 'Vencido', 'color' => 'orange'],
        ];

        return $estados[$this->estado] ?? ['label' => $this->estado, 'color' => 'gray'];
    }

    /**
     * Días para vencimiento
     */
    public function getDiasParaVencimientoAttribute(): ?int
    {
        if (!$this->fecha_vencimiento) return null;
        return now()->diffInDays($this->fecha_vencimiento, false);
    }

    protected $appends = ['estado_info', 'dias_para_vencimiento'];
}