<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Producto extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'productos';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'producto_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'codigo_principal',
        'nombre',
        'descripcion',
        'precio_unitario',
        'stock_actual',
        'iva_aplica',
        'ice_aplica',
        'categoria_id',
    ];

    /**
     * Obtiene la categoría del producto.
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    /**
     * Obtiene los movimientos de inventario del producto.
     */
    public function movimientosInventario()
    {
        return $this->hasMany(MovimientoInventario::class, 'producto_id');
    }

    /**
     * Obtiene los detalles de factura del producto.
     */
    public function detallesFactura()
    {
        return $this->hasMany(DetalleFactura::class, 'producto_id');
    }

    /**
     * Obtiene los detalles de compra del producto.
     */
    public function detallesCompra()
    {
        return $this->hasMany(DetalleCompra::class, 'producto_id');
    }
}
