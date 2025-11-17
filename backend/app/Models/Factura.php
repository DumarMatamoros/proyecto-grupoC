<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'facturas';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'factura_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'clave_acceso',
        'numero_establecimiento',
        'punto_emision',
        'fecha_emision',
        'hora',
        'total_sin_impuestos',
        'total_iva',
        'total',
        'estado',
        'cliente_id',
        'empleado_id',
        'sucursal_id',
    ];

    /**
     * Obtiene el cliente de la factura.
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * Obtiene el empleado que generó la factura.
     */
    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    /**
     * Obtiene la sucursal donde se emitió la factura.
     */
    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    /**
     * Obtiene los detalles de la factura.
     */
    public function detalles()
    {
        return $this->hasMany(DetalleFactura::class, 'factura_id');
    }

    /**
     * Obtiene los pagos de la factura.
     */
    public function pagos()
    {
        return $this->hasMany(Pago::class, 'factura_id');
    }
}
