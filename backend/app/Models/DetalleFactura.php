<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetalleFactura extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'detalle_facturas';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'detalle_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
        'iva',
        'total_detalle',
        'factura_id',
        'producto_id',
    ];

    /**
     * Obtiene la factura a la que pertenece el detalle.
     */
    public function factura()
    {
        return $this->belongsTo(Factura::class, 'factura_id');
    }

    /**
     * Obtiene el producto del detalle.
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
