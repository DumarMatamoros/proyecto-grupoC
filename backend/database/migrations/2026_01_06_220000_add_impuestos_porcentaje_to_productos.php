<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Porcentaje de IVA (por defecto 15% en Ecuador)
            $table->decimal('iva_porcentaje', 5, 2)->default(15.00)->after('iva_aplica');
            
            // Porcentaje de ICE (Impuesto a Consumos Especiales)
            $table->decimal('ice_porcentaje', 5, 2)->default(0.00)->after('ice_aplica');
            
            // Precio de venta CON impuestos incluidos (PVP)
            $table->decimal('precio_con_impuestos', 10, 2)->nullable()->after('precio_unitario');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['iva_porcentaje', 'ice_porcentaje', 'precio_con_impuestos']);
        });
    }
};
