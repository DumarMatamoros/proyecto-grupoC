<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MovimientoInventario extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'movimientos_inventario';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'movimiento_id';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
        protected $fillable = [
            'fecha',
            'tipo_movimiento',      // INGRESO, SALIDA, AJUSTE
            'tipo_documento',       // COMPRA, FACTURA, AJUSTE, DEVOLUCION, MERMA
            'numero_documento',
            'cantidad',
            'cantidad_entrada',
            'cantidad_salida',
            'stock_resultante',
            'costo_unitario',
            'referencia',
            'observaciones',
            'producto_id',
            'lote_id',
            'usuario_id',
        ];

        // Agregar relación con lote
        public function lote()
        {
            return $this->belongsTo(Lote::class, 'lote_id');
        }

        public function usuario()
        {
            return $this->belongsTo(User::class, 'usuario_id');
        }
    /**
     * Obtiene el producto del movimiento de inventario.
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
