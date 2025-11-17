<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla movimientos_inventario con llave foranea a productos
    public function up(): void
    {
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id('movimiento_id');
            $table->dateTime('fecha');
            $table->string('tipo_movimiento');
            $table->integer('cantidad');
            $table->string('referencia')->nullable();
            $table->timestamps();

            $table->unsignedBigInteger('producto_id');
            $table->foreign('producto_id')->references('producto_id')->on('productos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};
