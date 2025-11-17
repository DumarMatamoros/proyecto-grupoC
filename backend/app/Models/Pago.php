<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'pagos';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'pago_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tipo_pago',
        'valor',
        'fecha',
        'factura_id',
    ];

    /**
     * Obtiene la factura a la que pertenece el pago.
     */
    public function factura()
    {
        return $this->belongsTo(Factura::class, 'factura_id');
    }
}
