<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla bitacoras con llave foranea a empleados
    public function up(): void
    {
        Schema::create('bitacoras', function (Blueprint $table) {
            $table->id('log_id');
            $table->string('accion');
            $table->dateTime('fecha_hora');
            $table->text('detalle')->nullable();
            $table->timestamps();

            $table->unsignedBigInteger('empleado_id');
            $table->foreign('empleado_id')->references('empleado_id')->on('empleados');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bitacoras');
    }
};
