<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creacion de la tabla impuestos
    public function up(): void
    {
        Schema::create('impuestos', function (Blueprint $table) {
            $table->id('impuesto_id');
            $table->string('tipo');
            $table->decimal('porcentaje', 5, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('impuestos');
    }
};
