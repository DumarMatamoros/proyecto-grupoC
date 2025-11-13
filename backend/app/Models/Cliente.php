<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'clientes';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'cliente_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'usuario_id',
        'ruc_cedula',
        'razon_social',
        'direccion',
        'telefono',
        'tipo',
    ];

    /**
     * Obtiene el usuario asociado a este cliente.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene las facturas del cliente.
     */
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'cliente_id');
    }
}
