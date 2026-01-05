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
                $table->string('marca')->nullable()->after('nombre');
                $table->string('unidad_medida')->default('unidad')->after('marca'); // unidad, kg, litro
                $table->integer('stock_minimo')->default(10)->after('stock_actual');
                $table->integer('stock_maximo')->default(1000)->after('stock_minimo');
                $table->enum('estado', ['activo', 'inactivo'])->default('activo')->after('ice_aplica');
                    });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            //
        });
    }
};
