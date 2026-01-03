<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Egreso extends Model
{
    protected $table = 'egresos';
    protected $primaryKey = 'egreso_id';

    protected $fillable = [
        'fecha',
        'motivo',
        'observaciones',
        'total_unidades',
        'valor_total',
        'usuario_id',
        'sucursal_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'total_unidades' => 'integer',
        'valor_total' => 'decimal:2',
    ];

    /**
     * Motivos de egreso disponibles
     */
    public const MOTIVOS = [
        'desecho' => 'Desecho',
        'vencido' => 'Producto Vencido',
        'dañado' => 'Producto Dañado',
        'perdida' => 'Pérdida/Robo',
        'ajuste' => 'Ajuste de Inventario',
        'otro' => 'Otro',
    ];

    /**
     * Relación con el usuario que registró el egreso
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Relación con la sucursal
     */
    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id', 'sucursal_id');
    }

    /**
     * Relación con los detalles del egreso
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleEgreso::class, 'egreso_id', 'egreso_id');
    }

    /**
     * Calcular totales desde los detalles
     */
    public function calcularTotales(): void
    {
        $this->total_unidades = $this->detalles->sum('cantidad');
        $this->valor_total = $this->detalles->sum('subtotal');
        $this->save();
    }
}
