<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MovimientoInventario extends Model
{
    use HasFactory;

    protected $table = 'movimientos_inventario';
    protected $primaryKey = 'movimiento_id';

    protected $fillable = [
        'fecha',
        'tipo_movimiento',
        'tipo_documento',
        'numero_documento',
        'cantidad',
        'cantidad_entrada',
        'cantidad_salida',
        'stock_resultante',
        'costo_unitario',
        'referencia',
        'observaciones',
        'producto_id',
        'lote_id',
        'usuario_id',
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function lote()
    {
        return $this->belongsTo(Lote::class, 'lote_id');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
