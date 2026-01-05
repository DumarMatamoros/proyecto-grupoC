<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productos', function (Blueprint $table) {
            $table->id('producto_id');
            $table->string('codigo_principal')->unique();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->decimal('precio_unitario', 10, 2);
            $table->integer('stock_actual')->default(0);
            $table->boolean('iva_aplica')->default(false);
            $table->boolean('ice_aplica')->default(false);
            $table->timestamps();

            // FK manual porque categorias usa 'categoria_id' como PK
            $table->unsignedBigInteger('categoria_id')->nullable();
            $table->foreign('categoria_id')
                  ->references('categoria_id')
                  ->on('categorias')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
