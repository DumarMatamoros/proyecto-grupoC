<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Administrador extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'administradores';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'administrador_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'usuario_id',
        'nivel',
        'permisos',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array
     */
    protected $casts = [
        'permisos' => 'json',
    ];

    /**
     * Obtiene el usuario asociado a este administrador.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }
}
