<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla productos con llave foranea a categorias
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id('producto_id');
            $table->string('codigo_principal')->unique();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('precio_unitario', 10, 2);
            $table->integer('stock_actual');
            $table->boolean('iva_aplica');
            $table->boolean('ice_aplica');
            $table->timestamps();

            $table->unsignedBigInteger('categoria_id');
            $table->foreign('categoria_id')->references('categoria_id')->on('categorias');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
