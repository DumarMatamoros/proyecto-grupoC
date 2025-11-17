<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'compras';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'compra_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'fecha',
        'numero_factura_proveedor',
        'total',
        'proveedor_id',
    ];

    /**
     * Obtiene el proveedor de la compra.
     */
    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * Obtiene los detalles de la compra.
     */
    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }
}
