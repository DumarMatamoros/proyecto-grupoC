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
        Schema::create('administradores', function (Blueprint $table) {
            $table->id('administrador_id');
            $table->unsignedBigInteger('usuario_id')->unique();
            $table->string('nivel')->default('standard');
            $table->json('permisos')->nullable();
            $table->timestamps();
            
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
