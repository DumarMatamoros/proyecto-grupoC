<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla clientes con llave foranea a usuarios
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id('cliente_id');
            $table->unsignedBigInteger('usuario_id');
            $table->string('ruc_cedula')->unique();
            $table->string('razon_social')->nullable();
            $table->string('direccion');
            $table->string('telefono');
            $table->string('tipo')->default('natural'); // 'natural' o 'juridica'
            $table->timestamps();

            // Llave foránea
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
