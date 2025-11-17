<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Empleado extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'empleados';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'empleado_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'usuario_id',
        'sucursal_id',
        'departamento',
        'fecha_inicio',
    ];

    /**
     * Obtiene el usuario asociado a este empleado.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene la sucursal a la que pertenece el empleado.
     */
    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    /**
     * Obtiene los registros de bitácora del empleado.
     */
    public function bitacoras()
    {
        return $this->hasMany(Bitacora::class, 'empleado_id');
    }

    /**
     * Obtiene las facturas generadas por el empleado.
     */
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'empleado_id');
    }
}
