<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleEgreso extends Model
{
    protected $table = 'detalle_egresos';
    protected $primaryKey = 'detalle_egreso_id';

    protected $fillable = [
        'cantidad',
        'precio_unitario',
        'subtotal',
        'motivo_detalle',
        'fecha_vencimiento',
        'egreso_id',
        'producto_id',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    /**
     * Relación con el egreso
     */
    public function egreso(): BelongsTo
    {
        return $this->belongsTo(Egreso::class, 'egreso_id', 'egreso_id');
    }

    /**
     * Relación con el producto
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id', 'producto_id');
    }

    /**
     * Boot del modelo para calcular subtotal automáticamente
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($detalle) {
            $detalle->subtotal = $detalle->cantidad * $detalle->precio_unitario;
        });

        static::updating(function ($detalle) {
            $detalle->subtotal = $detalle->cantidad * $detalle->precio_unitario;
        });
    }
}
