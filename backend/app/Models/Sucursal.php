<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sucursal extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'sucursales';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'sucursal_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'direccion',
        'punto_emision',
    ];

    /**
     * Obtiene los empleados de la sucursal.
     */
    public function empleados()
    {
        return $this->hasMany(Empleado::class, 'sucursal_id');
    }

    /**
     * Obtiene las facturas de la sucursal.
     */
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'sucursal_id');
    }
}
