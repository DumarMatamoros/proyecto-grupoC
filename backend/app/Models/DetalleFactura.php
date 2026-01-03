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
        'iva_aplica',
        'porcentaje_iva',
        'descuento',
        'subtotal',
        'iva',
        'total_detalle',
        'factura_id',
        'producto_id',
    ];

    /**
     * Los atributos que deben ser casteados.
     */
    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'descuento' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'iva' => 'decimal:2',
        'total_detalle' => 'decimal:2',
        'iva_aplica' => 'boolean',
        'porcentaje_iva' => 'decimal:2',
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
