<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla pagos con llave foranea a facturas
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id('pago_id');
            $table->string('tipo_pago');
            $table->decimal('valor', 10, 2);
            $table->date('fecha');
            $table->timestamps();

            $table->unsignedBigInteger('factura_id');
            $table->foreign('factura_id')->references('factura_id')->on('facturas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
