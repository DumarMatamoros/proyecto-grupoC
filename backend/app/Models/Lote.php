<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lote extends Model
{
    protected $table = 'lotes';
    protected $primaryKey = 'lote_id';

    protected $fillable = [
        'numero_lote',
        'fecha_ingreso',
        'fecha_caducidad',
        'costo_unitario',
        'stock_inicial',
        'stock_actual',
        'estado',
        'producto_id',
        'proveedor_id',
        'compra_id',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_caducidad' => 'date',
    ];

    // Relaciones
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    // Método FIFO: obtener el lote más antiguo con stock
    public static function obtenerLoteFIFO($productoId, $cantidadRequerida)
    {
        return self::where('producto_id', $productoId)
            ->where('stock_actual', '>', 0)
            ->where('estado', 'disponible')
            ->where(function($query) {
                $query->whereNull('fecha_caducidad')
                      ->orWhere('fecha_caducidad', '>', now());
            })
            ->orderBy('fecha_ingreso', 'asc')  // El más antiguo primero
            ->orderBy('lote_id', 'asc')
            ->first();
    }
}