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
        
        $this->total_sin_impuestos = $subtotal;
        $this->total_iva = $totalIva;
        $this->total = $subtotal + $totalIva - $descuento;
        $this->save();
    }
}
