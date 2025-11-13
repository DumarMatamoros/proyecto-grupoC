<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla compras con llave foranea a proveedores
    public function up(): void
    {
        Schema::create('compras', function (Blueprint $table) {
            $table->id('compra_id');
            $table->date('fecha');
            $table->string('numero_factura_proveedor');
            $table->decimal('total', 10, 2);
            $table->timestamps();

            $table->unsignedBigInteger('proveedor_id');
            $table->foreign('proveedor_id')->references('proveedor_id')->on('proveedores');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compras');
    }
};
