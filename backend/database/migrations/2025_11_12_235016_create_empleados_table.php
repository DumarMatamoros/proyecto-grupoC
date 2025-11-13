<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('empleados', function (Blueprint $table) {
            $table->id('empleado_id');
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('sucursal_id');
            $table->string('departamento')->nullable();
            $table->date('fecha_inicio')->nullable();
            $table->timestamps();

            // Llaves foráneas
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('cascade');
            $table->foreign('sucursal_id')->references('sucursal_id')->on('sucursales')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empleados');
    }
};
