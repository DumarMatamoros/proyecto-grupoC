<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla detalle_compras con llaves foraneas a compras y productos
    public function up(): void
    {
        Schema::create('detalle_compras', function (Blueprint $table) {
            $table->id('detalle_compra_id');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('iva', 10, 2);
            $table->decimal('total', 10, 2);
            $table->timestamps();

            $table->unsignedBigInteger('compra_id');
            $table->unsignedBigInteger('producto_id');

            $table->foreign('compra_id')->references('compra_id')->on('compras');
            $table->foreign('producto_id')->references('producto_id')->on('productos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_compras');
    }
};
