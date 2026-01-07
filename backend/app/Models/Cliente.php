<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Cliente
 * 
 * Representa entidades externas a las que se les factura.
 * NO tienen acceso al sistema (sin login, sin password).
 * 
 * Cumple con los requisitos del SRI (Ecuador) para facturación electrónica.
 */
class Cliente extends Model
{
    use HasFactory;

    /**
     * La tabla asociada con el modelo.
     */
    protected $table = 'clientes';

    /**
     * La clave primaria asociada con la tabla.
     */
    protected $primaryKey = 'cliente_id';

    /**
     * Tipos de identificación válidos según el SRI de Ecuador.
     */
    public const ID_TYPES = [
        'RUC' => 'RUC',
        'CEDULA' => 'Cédula',
        'PASAPORTE' => 'Pasaporte',
        'CONSUMIDOR_FINAL' => 'Consumidor Final',
    ];

    /**
     * ID para Consumidor Final según normativa SRI.
     */
    public const CONSUMIDOR_FINAL_ID = '9999999999999';

    /**
     * Los atributos que son asignables en masa.
     */
    protected $fillable = [
        'id_type',
        'id_number',
        'razon_social',
        'direccion',
        'telefono',
        'email',
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
    ];

    // =========================================
    // RELACIONES
    // =========================================

    /**
     * Obtiene las facturas del cliente.
     */
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'cliente_id', 'cliente_id');
    }

    // =========================================
    // SCOPES
    // =========================================

    /**
     * Scope para filtrar solo clientes activos.
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
     * Scope para buscar por número de identificación o razón social.
     */
    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('id_number', 'like', "%{$term}%")
              ->orWhere('razon_social', 'like', "%{$term}%")
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
     * Formatea la identificación para mostrar (tipo + número).
     */
    public function getIdentificacionCompletaAttribute(): string
    {
        return "{$this->id_type_label}: {$this->id_number}";
    }

    /**
     * Verifica si es consumidor final.
     */
    public function getIsConsumidorFinalAttribute(): bool
    {
        return $this->id_type === 'CONSUMIDOR_FINAL' || 
               $this->id_number === self::CONSUMIDOR_FINAL_ID;
    }

    // =========================================
    // MÉTODOS ESTÁTICOS
    // =========================================

    /**
     * Obtiene o crea el cliente "Consumidor Final".
     */
    public static function getConsumidorFinal(): self
    {
        return self::firstOrCreate(
            ['id_number' => self::CONSUMIDOR_FINAL_ID],
            [
                'id_type' => 'CONSUMIDOR_FINAL',
                'razon_social' => 'CONSUMIDOR FINAL',
                'direccion' => 'N/A',
                'telefono' => 'N/A',
                'email' => null,
                'is_active' => true,
            ]
        );
    }

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
            case 'CONSUMIDOR_FINAL':
                return $number === self::CONSUMIDOR_FINAL_ID;
            default:
                return false;
        }
    }
}
