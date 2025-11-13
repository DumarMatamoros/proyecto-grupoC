<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla detalle_facturas con llaves foraneas a facturas y productos
    public function up(): void
    {
        Schema::create('detalle_facturas', function (Blueprint $table) {
            $table->id('detalle_id');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 10, 2);
            $table->decimal('descuento', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2);
            $table->decimal('iva', 10, 2);
            $table->decimal('total_detalle', 10, 2);
            $table->timestamps();

            $table->unsignedBigInteger('factura_id');
            $table->unsignedBigInteger('producto_id');

            $table->foreign('factura_id')->references('factura_id')->on('facturas');
            $table->foreign('producto_id')->references('producto_id')->on('productos');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_facturas');
    }
};
