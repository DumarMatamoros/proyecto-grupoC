<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Proveedor extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'proveedores';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'proveedor_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'usuario_id',
        'ruc',
        'razon_social',
        'direccion',
        'telefono',
        'sitio_web',
    ];

    /**
     * Obtiene el usuario asociado a este proveedor.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene las compras del proveedor.
     */
    public function compras()
    {
        return $this->hasMany(Compra::class, 'proveedor_id');
    }
}
