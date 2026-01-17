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
        'numero_factura',
        'numero_establecimiento',
        'punto_emision',
        'fecha_emision',
        'hora',
        'total_sin_impuestos',
        'descuento',
        'total_iva',
        'total',
        'estado',
        'tipo_documento',
        'cedula_cliente',
        'nombre_cliente',
        'direccion_cliente',
        'telefono_cliente',
        'email_cliente',
        'forma_pago',
        'observaciones',
        'cliente_id',
        'empleado_id',
        'sucursal_id',
        'usuario_id',
    ];

    /**
     * Los atributos que deben ser casteados.
     */
    protected $casts = [
        'fecha_emision' => 'date',
        'total_sin_impuestos' => 'decimal:2',
        'descuento' => 'decimal:2',
        'total_iva' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Estados de factura disponibles
     */
    public const ESTADOS = [
        'pendiente' => 'Pendiente',
        'emitida' => 'Emitida',
        'pagada' => 'Pagada',
        'anulada' => 'Anulada',
    ];

    /**
     * Formas de pago disponibles
     */
    public const FORMAS_PAGO = [
        'efectivo' => 'Efectivo',
        'tarjeta' => 'Tarjeta',
        'transferencia' => 'Transferencia Bancaria',
        'cheque' => 'Cheque',
        'credito' => 'Crédito',
    ];

    /**
     * Obtiene el cliente de la factura.
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id', 'cliente_id');
    }

    /**
     * Obtiene el empleado que generó la factura.
     */
    public function empleado()
    {
        return $this->belongsTo(Empleado::class, 'empleado_id', 'empleado_id');
    }

    /**
     * Obtiene la sucursal donde se emitió la factura.
     */
    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id', 'sucursal_id');
    }

    /**
     * Obtiene el usuario que creó la factura.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene los detalles de la factura.
     */
    public function detalles()
    {
        return $this->hasMany(DetalleFactura::class, 'factura_id', 'factura_id');
    }

    /**
     * Obtiene los pagos de la factura.
     */
    public function pagos()
    {
        return $this->hasMany(Pago::class, 'factura_id', 'factura_id');
    }

    /**
     * Verifica si es consumidor final
     */
    public function esConsumidorFinal(): bool
    {
        return $this->cedula_cliente === '9999999999999' || $this->cliente_id === null;
    }

    /**
     * Genera la clave de acceso para Ecuador (49 dígitos)
     */
    public static function generarClaveAcceso(
        string $fechaEmision,
        string $tipoComprobante,
        string $rucEmisor,
        string $ambiente,
        string $serie,
        string $secuencial,
        string $codigoNumerico,
        string $tipoEmision
    ): string {
        // Formato: DDMMAAAA + tipoComprobante(2) + RUC(13) + ambiente(1) + serie(6) + secuencial(9) + codigoNumerico(8) + tipoEmision(1)
        $fechaFormato = date('dmY', strtotime($fechaEmision));
        
        $claveBase = $fechaFormato . 
                     str_pad($tipoComprobante, 2, '0', STR_PAD_LEFT) .
                     $rucEmisor .
                     $ambiente .
                     $serie .
                     str_pad($secuencial, 9, '0', STR_PAD_LEFT) .
                     str_pad($codigoNumerico, 8, '0', STR_PAD_LEFT) .
                     $tipoEmision;
        
        // Calcular dígito verificador (módulo 11)
        $digitoVerificador = self::calcularModulo11($claveBase);
        
        return $claveBase . $digitoVerificador;
    }

    /**
     * Calcula el dígito verificador usando módulo 11
     */
    private static function calcularModulo11(string $cadena): int
    {
        $factores = [2, 3, 4, 5, 6, 7];
        $suma = 0;
        $indice = 0;
        
        for ($i = strlen($cadena) - 1; $i >= 0; $i--) {
            $suma += intval($cadena[$i]) * $factores[$indice % 6];
            $indice++;
        }
        
        $residuo = $suma % 11;
        $digito = 11 - $residuo;
        
        if ($digito == 11) return 0;
        if ($digito == 10) return 1;
        
        return $digito;
    }

    /**
     * Calcula los totales de la factura
     */
    public function calcularTotales(): void
    {
        $subtotal = $this->detalles->sum('subtotal');
        $totalIva = $this->detalles->sum('iva');
        $descuento = $this->descuento ?? 0;
        
        $this->total_sin_impuestos = (string)$subtotal;
        $this->total_iva = (string)$totalIva;
        $this->total = (string)($subtotal + $totalIva - $descuento);
        $this->save();
    }

    /**
     * Scope para filtrar por rango de fechas
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $startDate Fecha de inicio (Y-m-d)
     * @param string|null $endDate Fecha de fin (Y-m-d)
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFilterByDate($query, $startDate = null, $endDate = null)
    {
        // Si no se proporcionan fechas, devolver el mes actual
        if (empty($startDate) && empty($endDate)) {
            return $query;
        }

        // Solo fecha de inicio
        if (!empty($startDate) && empty($endDate)) {
            return $query->whereDate('fecha_emision', '>=', $startDate);
        }

        // Solo fecha de fin
        if (empty($startDate) && !empty($endDate)) {
            return $query->whereDate('fecha_emision', '<=', $endDate);
        }

        // Ambas fechas
        return $query->whereDate('fecha_emision', '>=', $startDate)
                     ->whereDate('fecha_emision', '<=', $endDate);
    }

    /**
     * Scope para búsqueda general
     * Busca por número de factura, cédula/RUC o nombre del cliente
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $search Término de búsqueda
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearch($query, $search = null)
    {
        if (empty($search)) {
            return $query;
        }

        $search = trim($search);
        
        return $query->where(function ($q) use ($search) {
            $q->where('numero_factura', 'ILIKE', "%{$search}%")
              ->orWhere('cedula_cliente', 'ILIKE', "%{$search}%")
              ->orWhere('nombre_cliente', 'ILIKE', "%{$search}%")
              ->orWhere('clave_acceso', 'ILIKE', "%{$search}%");
        });
    }

    /**
     * Scope para filtrar por estado
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $estado Estado de la factura
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFilterByEstado($query, $estado = null)
    {
        if (empty($estado)) {
            return $query;
        }

        return $query->where('estado', $estado);
    }

    /**
     * Scope para filtrar por forma de pago
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $formaPago Forma de pago
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFilterByFormaPago($query, $formaPago = null)
    {
        if (empty($formaPago)) {
            return $query;
        }

        return $query->where('forma_pago', $formaPago);
    }

    /**
     * Scope para obtener solo facturas válidas (emitidas o pagadas)
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeValidas($query)
    {
        return $query->whereIn('estado', ['emitida', 'pagada']);
    }

    /**
     * Obtener el nombre legible del estado
     */
    public function getEstadoLabelAttribute(): string
    {
        return self::ESTADOS[$this->estado] ?? $this->estado;
    }

    /**
     * Obtener el nombre legible de la forma de pago
     */
    public function getFormaPagoLabelAttribute(): string
    {
        return self::FORMAS_PAGO[$this->forma_pago] ?? $this->forma_pago;
    }
}
