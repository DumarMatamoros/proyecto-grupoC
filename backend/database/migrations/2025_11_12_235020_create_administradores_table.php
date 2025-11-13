<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    //Creación de la tabla administradores con llave foranea a usuarios
    public function up(): void
    {
        Schema::create('administradores', function (Blueprint $table) {
            $table->id('administrador_id');
            $table->unsignedBigInteger('usuario_id');
            $table->string('nivel')->default('super'); // 'super', 'moderador', 'editor'
            $table->text('permisos')->nullable(); // JSON con permisos específicos
            $table->timestamps();

            // Llave foránea
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('administradores');
    }
};
