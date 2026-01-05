<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotes', function (Blueprint $table) {
            $table->id('lote_id');

            // FK manual porque productos usa 'producto_id' como PK
            $table->unsignedBigInteger('producto_id');
            $table->foreign('producto_id')
                  ->references('producto_id')
                  ->on('productos')
                  ->onDelete('cascade');

            $table->integer('cantidad_inicial');
            $table->integer('cantidad_disponible');

            $table->decimal('costo_unitario', 10, 2);

            $table->date('fecha_ingreso');
            $table->date('fecha_vencimiento')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lotes');
    }
};
