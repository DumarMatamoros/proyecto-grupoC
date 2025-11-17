<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla sucursales
    public function up(): void
    {
        Schema::create('sucursales', function (Blueprint $table) {
            $table->id('sucursal_id');
            $table->string('nombre');
            $table->string('direccion');
            $table->string('punto_emision');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sucursales');
    }
};
