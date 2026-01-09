<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';
    protected $primaryKey = 'producto_id';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'codigo_principal',
        'codigo_barras',
        'sku',
        'nombre',
        'marca',
        'unidad_medida',
        'descripcion',
        'precio_costo',
        'costo_promedio',
        'precio_unitario',
        'precio_con_impuestos',
        'margen_ganancia',
        'modo_precio',
        'stock_actual',
        'stock_minimo',
        'stock_maximo',
        'iva_aplica',
        'iva_porcentaje',
        'ice_aplica',
        'ice_porcentaje',
        'estado',
        'categoria_id',
        'proveedor_principal_id',
        'ubicacion_bodega',
        'imagen'
    ];

    protected $casts = [
        'iva_aplica' => 'boolean',
        'ice_aplica' => 'boolean',
        'precio_costo' => 'decimal:2',
        'costo_promedio' => 'decimal:4',
        'precio_unitario' => 'decimal:2',
        'precio_con_impuestos' => 'decimal:2',
        'margen_ganancia' => 'decimal:2',
        'iva_porcentaje' => 'decimal:2',
        'ice_porcentaje' => 'decimal:2',
    ];

    // ==================== ATRIBUTOS CALCULADOS ====================

    /**
     * Calcular el valor del IVA
     */
    public function getIvaValorAttribute(): float
    {
        if (!$this->iva_aplica) return 0;
        return round($this->precio_unitario * ($this->iva_porcentaje / 100), 2);
    }

    /**
     * Calcular el valor del ICE
     */
    public function getIceValorAttribute(): float
    {
        if (!$this->ice_aplica) return 0;
        return round($this->precio_unitario * ($this->ice_porcentaje / 100), 2);
    }

    /**
     * Calcular precio final con impuestos
     */
    public function getPrecioFinalAttribute(): float
    {
        $precio = $this->precio_unitario;
        $precio += $this->iva_valor;
        $precio += $this->ice_valor;
        return round($precio, 2);
    }

    /**
     * Obtener desglose de impuestos
     */
    public function getDesgloseImpuestosAttribute(): array
    {
        return [
            'precio_base' => (float) $this->precio_unitario,
            'iva_aplica' => $this->iva_aplica,
            'iva_porcentaje' => (float) ($this->iva_porcentaje ?? 0),
            'iva_valor' => $this->iva_valor,
            'ice_aplica' => $this->ice_aplica,
            'ice_porcentaje' => (float) ($this->ice_porcentaje ?? 0),
            'ice_valor' => $this->ice_valor,
            'total_impuestos' => round($this->iva_valor + $this->ice_valor, 2),
            'precio_final' => $this->precio_final,
        ];
    }

    // Agregar a la respuesta JSON
    protected $appends = ['iva_valor', 'ice_valor', 'precio_final', 'desglose_impuestos'];

    // ==================== RELACIONES ====================

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id', 'categoria_id');
    }

    public function proveedorPrincipal()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_principal_id', 'proveedor_id');
    }

    public function lotes()
    {
        return $this->hasMany(Lote::class, 'producto_id', 'producto_id');
    }

    public function lotesDisponibles()
    {
        return $this->hasMany(Lote::class, 'producto_id', 'producto_id')
            ->where('cantidad_disponible', '>', 0)
            ->where(function($q) {
                $q->whereNull('fecha_vencimiento')
                  ->orWhere('fecha_vencimiento', '>', now());
            })
            ->orderBy('fecha_ingreso', 'asc');
    }

    public function movimientos()
    {
        return $this->hasMany(MovimientoInventario::class, 'producto_id', 'producto_id');
    }

    // ==================== MÉTODOS DE STOCK ====================

    /**
     * Verificar si tiene stock bajo
     */
    public function tieneStockBajo(): bool
    {
        return $this->stock_actual <= ($this->stock_minimo ?? 10);
    }

    /**
     * Verificar si tiene stock disponible
     */
    public function tieneStock(int $cantidad = 1): bool
    {
        return $this->stock_actual >= $cantidad;
    }

    /**
     * Obtener lotes disponibles ordenados por FIFO
     */
    public function getLotesFIFO()
    {
        return $this->lotes()
            ->where('cantidad_disponible', '>', 0)
            ->where(function($query) {
                $query->whereNull('fecha_vencimiento')
                      ->orWhere('fecha_vencimiento', '>', now());
            })
            ->orderBy('fecha_ingreso', 'asc')
            ->orderBy('lote_id', 'asc')
            ->get();
    }

    /**
     * Descontar stock usando FIFO
     * Retorna array con los lotes usados y cantidades
     */
    public function descontarStockFIFO(int $cantidad): array
    {
        $lotesUsados = [];
        $cantidadRestante = $cantidad;

        $lotes = $this->getLotesFIFO();

        foreach ($lotes as $lote) {
            if ($cantidadRestante <= 0) break;

            $cantidadDelLote = min($lote->cantidad_disponible, $cantidadRestante);
            
            $lote->cantidad_disponible -= $cantidadDelLote;
            $lote->save();

            $lotesUsados[] = [
                'lote_id' => $lote->lote_id,
                'cantidad' => $cantidadDelLote,
                'costo_unitario' => $lote->costo_unitario,
            ];

            $cantidadRestante -= $cantidadDelLote;
        }

        // Actualizar stock general del producto
        $this->stock_actual -= $cantidad;
        $this->save();

        return $lotesUsados;
    }

    /**
     * Calcular valor del inventario
     */
    public function getValorInventario(): float
    {
        return $this->stock_actual * ($this->precio_costo ?? $this->precio_unitario);
    }
}
