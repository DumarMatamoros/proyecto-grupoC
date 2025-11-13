<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    protected $table = 'configuraciones';
    protected $primaryKey = 'configuracion_id';
    protected $keyType = 'int';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'clave',
        'valor',
        'tipo',
        'descripcion',
        'grupo',
        'editable',
    ];

    protected $casts = [
        'editable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Obtener una configuración por clave
     */
    public static function obtener($clave, $default = null)
    {
        $config = self::where('clave', $clave)->first();
        return $config ? $config->valor : $default;
    }

    /**
     * Establecer una configuración
     */
    public static function establecer($clave, $valor, $tipo = 'string', $grupo = null, $descripcion = null)
    {
        return self::updateOrCreate(
            ['clave' => $clave],
            [
                'valor' => $valor,
                'tipo' => $tipo,
                'grupo' => $grupo,
                'descripcion' => $descripcion,
                'editable' => true,
            ]
        );
    }

    /**
     * Obtener valor formateado según tipo
     */
    public function getValorFormateado()
    {
        return match ($this->tipo) {
            'numeric' => (float) $this->valor,
            'boolean' => (bool) $this->valor,
            'json' => json_decode($this->valor, true),
            default => $this->valor,
        };
    }
}
