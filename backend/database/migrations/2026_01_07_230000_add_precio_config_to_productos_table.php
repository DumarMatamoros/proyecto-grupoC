<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Margen de ganancia (%)
            if (!Schema::hasColumn('productos', 'margen_ganancia')) {
                $table->decimal('margen_ganancia', 8, 2)->default(30.00)->after('precio_con_impuestos');
            }
            
            // Modo de precio: 'automatico' o 'manual'
            if (!Schema::hasColumn('productos', 'modo_precio')) {
                $table->enum('modo_precio', ['automatico', 'manual'])->default('automatico')->after('margen_ganancia');
            }
            
            // Costo promedio ponderado (se actualiza con cada ingreso de lote)
            if (!Schema::hasColumn('productos', 'costo_promedio')) {
                $table->decimal('costo_promedio', 12, 4)->nullable()->after('precio_costo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['margen_ganancia', 'modo_precio', 'costo_promedio']);
        });
    }
};
