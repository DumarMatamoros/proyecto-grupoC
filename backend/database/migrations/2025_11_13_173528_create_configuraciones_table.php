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
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->id('configuracion_id');
            $table->string('clave')->unique(); // Nombre de la configuración (ej: 'iva_porcentaje')
            $table->text('valor'); // Valor de la configuración
            $table->string('tipo')->default('numeric'); // Tipo: numeric, string, boolean, json
            $table->text('descripcion')->nullable(); // Descripción de qué es la config
            $table->string('grupo')->nullable(); // Grupo: 'facturacion', 'sistema', etc
            $table->boolean('editable')->default(true); // ¿Puede editarse desde interfaz?
            $table->timestamps();
            
            // Índices
            $table->index('clave');
            $table->index('grupo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
