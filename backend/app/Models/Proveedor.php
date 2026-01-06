<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Modelo Proveedor
 * 
 * Representa entidades externas a las que se les compra mercadería/servicios.
 * NO tienen acceso al sistema (sin login, sin password).
 * 
 * Cumple con los requisitos del SRI (Ecuador) para compras y retenciones.
 */
class Proveedor extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     */
    protected $table = 'proveedores';

    /**
     * La clave primaria asociada con la tabla.
     */
    protected $primaryKey = 'proveedor_id';

    /**
     * Tipos de identificación válidos según el SRI de Ecuador.
     */
    public const ID_TYPES = [
        'RUC' => 'RUC',
        'CEDULA' => 'Cédula',
        'PASAPORTE' => 'Pasaporte',
    ];

    /**
     * Tipos de proveedor.
     */
    public const TIPOS_PROVEEDOR = [
        'BIENES' => 'Bienes/Mercadería',
        'SERVICIOS' => 'Servicios',
        'MIXTO' => 'Bienes y Servicios',
    ];

    /**
     * Tipos de cuenta bancaria.
     */
    public const TIPOS_CUENTA = [
        'AHORROS' => 'Cuenta de Ahorros',
        'CORRIENTE' => 'Cuenta Corriente',
    ];

    /**
     * Los atributos que son asignables en masa.
     */
    protected $fillable = [
        'id_type',
        'id_number',
        'razon_social',
        'nombre_comercial',
        'direccion',
        'telefono',
        'sitio_web',
        'email',
        'contacto_nombre',
        'contacto_telefono',
        'contacto_email',
        'tipo_proveedor',
        'banco',
        'cuenta_bancaria',
        'tipo_cuenta',
        'is_active',
        'notes',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos.
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Valores por defecto para los atributos.
     */
    protected $attributes = [
        'is_active' => true,
        'id_type' => 'RUC',
        'tipo_proveedor' => 'BIENES',
    ];

    // =========================================
    // RELACIONES
    // =========================================

    /**
     * Obtiene las compras del proveedor.
     */
    public function compras()
    {
        return $this->hasMany(Compra::class, 'proveedor_id', 'proveedor_id');
    }

    // =========================================
    // SCOPES
    // =========================================

    /**
     * Scope para filtrar solo proveedores activos.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para filtrar por tipo de identificación.
     */
    public function scopeByIdType($query, string $type)
    {
        return $query->where('id_type', $type);
    }

    /**
     * Scope para filtrar por tipo de proveedor.
     */
    public function scopeByTipo($query, string $tipo)
    {
        return $query->where('tipo_proveedor', $tipo);
    }

    /**
     * Scope para buscar por número de identificación o razón social.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('id_number', 'like', "%{$term}%")
              ->orWhere('razon_social', 'like', "%{$term}%")
              ->orWhere('nombre_comercial', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%");
        });
    }

    // =========================================
    // ACCESSORS & MUTATORS
    // =========================================

    /**
     * Obtiene el label del tipo de identificación.
     */
    public function getIdTypeLabelAttribute(): string
    {
        return self::ID_TYPES[$this->id_type] ?? $this->id_type;
    }

    /**
     * Obtiene el label del tipo de proveedor.
     */
    public function getTipoProveedorLabelAttribute(): string
    {
        return self::TIPOS_PROVEEDOR[$this->tipo_proveedor] ?? $this->tipo_proveedor;
    }

    /**
     * Formatea la identificación para mostrar (tipo + número).
     */
    public function getIdentificacionCompletaAttribute(): string
    {
        return "{$this->id_type_label}: {$this->id_number}";
    }

    /**
     * Obtiene el nombre para mostrar (nombre comercial o razón social).
     */
    public function getNombreMostrarAttribute(): string
    {
        return $this->nombre_comercial ?: $this->razon_social;
    }

    /**
     * Obtiene la información de contacto formateada.
     */
    public function getContactoInfoAttribute(): ?array
    {
        if (!$this->contacto_nombre) {
            return null;
        }

        return [
            'nombre' => $this->contacto_nombre,
            'telefono' => $this->contacto_telefono,
            'email' => $this->contacto_email,
        ];
    }

    /**
     * Obtiene la información bancaria formateada.
     */
    public function getInfoBancariaAttribute(): ?array
    {
        if (!$this->banco || !$this->cuenta_bancaria) {
            return null;
        }

        return [
            'banco' => $this->banco,
            'cuenta' => $this->cuenta_bancaria,
            'tipo' => self::TIPOS_CUENTA[$this->tipo_cuenta] ?? $this->tipo_cuenta,
        ];
    }

    // =========================================
    // MÉTODOS ESTÁTICOS
    // =========================================

    /**
     * Valida el formato del número de identificación según el tipo.
     */
    public static function validateIdNumber(string $type, string $number): bool
    {
        switch ($type) {
            case 'RUC':
                return strlen($number) === 13 && ctype_digit($number);
            case 'CEDULA':
                return strlen($number) === 10 && ctype_digit($number);
            case 'PASAPORTE':
                return strlen($number) >= 5 && strlen($number) <= 20;
            default:
                return false;
        }
    }
}
