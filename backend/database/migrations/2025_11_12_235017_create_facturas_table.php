<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla facturas con llaves foraneas a clientes, empleados y sucursales
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id('factura_id');
            $table->string('clave_acceso')->unique();
            $table->string('numero_establecimiento');
            $table->string('punto_emision');
            $table->date('fecha_emision');
            $table->time('hora');
            $table->decimal('total_sin_impuestos', 10, 2);
            $table->decimal('total_iva', 10, 2);
            $table->decimal('total', 10, 2);
            $table->string('estado');
            $table->timestamps();

            $table->unsignedBigInteger('cliente_id');
            $table->unsignedBigInteger('empleado_id');
            $table->unsignedBigInteger('sucursal_id');

            $table->foreign('cliente_id')->references('cliente_id')->on('clientes');
            $table->foreign('empleado_id')->references('empleado_id')->on('empleados');
            $table->foreign('sucursal_id')->references('sucursal_id')->on('sucursales');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};
