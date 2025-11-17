<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $table = 'productos';
    protected $primaryKey = 'producto_id';

    //  IMPORTANTE PARA POSTGRES
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'codigo_principal',
        'nombre',
        'descripcion',
        'precio_unitario',
        'stock_actual',
        'iva_aplica',
        'ice_aplica',
        'categoria_id',
        'imagen'
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
}
