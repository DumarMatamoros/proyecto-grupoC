<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * La tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'usuarios';

    /**
     * La clave primaria asociada con la tabla.
     *
     * @var string
     */
    protected $primaryKey = 'usuario_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'email',
        'password',
        'tipo',
        'avatar',
        'telefono',
        'must_change_password',
        'email_verified_at',
        'remember_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['avatar_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    /**
     * Obtener la URL completa del avatar.
     *
     * @return string|null
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return asset('storage/' . $this->avatar);
        }
        return null;
    }

    /**
     * Obtiene el empleado asociado a este usuario.
     */
    public function empleado()
    {
        return $this->hasOne(Empleado::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene el cliente asociado a este usuario.
     */
    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene el proveedor asociado a este usuario.
     */
    public function proveedor()
    {
        return $this->hasOne(Proveedor::class, 'usuario_id', 'usuario_id');
    }

    /**
     * Obtiene el administrador asociado a este usuario.
     */
    public function administrador()
    {
        return $this->hasOne(Administrador::class, 'usuario_id', 'usuario_id');
    }
}
