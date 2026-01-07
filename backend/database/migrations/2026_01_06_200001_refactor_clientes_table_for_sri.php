<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Refactorización de la tabla clientes.
 * 
 * CAMBIO DE ARQUITECTURA:
 * - Antes: Clientes estaban vinculados a Usuarios (login)
 * - Ahora: Clientes son entidades externas para facturación (sin login)
 * 
 * Esta migración cumple con los requisitos del SRI (Ecuador) para
 * facturación electrónica.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero actualizar valores nulos en razon_social
        DB::table('clientes')
            ->whereNull('razon_social')
            ->update(['razon_social' => 'SIN NOMBRE']);

        // Eliminar la foreign key existente
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropForeign(['usuario_id']);
        });

        // Modificar la estructura de la tabla
        Schema::table('clientes', function (Blueprint $table) {
            // Eliminar columna usuario_id (ya no se vincula a usuarios)
            $table->dropColumn('usuario_id');
            
            // Eliminar columna tipo anterior
            $table->dropColumn('tipo');
            
            // Renombrar ruc_cedula a id_number para mayor claridad
            $table->renameColumn('ruc_cedula', 'id_number');
        });

        // Agregar nuevas columnas según normativa SRI
        Schema::table('clientes', function (Blueprint $table) {
            // Tipo de identificación (requerido por SRI)
            $table->enum('id_type', [
                'RUC',           // Registro Único de Contribuyentes (13 dígitos)
                'CEDULA',        // Cédula de identidad (10 dígitos)
                'PASAPORTE',     // Pasaporte (extranjeros)
                'CONSUMIDOR_FINAL' // Consumidor final (9999999999999)
            ])->default('CEDULA')->after('cliente_id');
            
            // Email obligatorio para facturación electrónica
            $table->string('email')->nullable()->after('telefono');
            
            // Estado activo/inactivo
            $table->boolean('is_active')->default(true)->after('email');
            
            // Notas adicionales
            $table->text('notes')->nullable()->after('is_active');
        });

        // Actualizar la columna razon_social para que sea obligatoria
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('razon_social')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            // Eliminar nuevas columnas
            $table->dropColumn(['id_type', 'email', 'is_active', 'notes']);
            
            // Restaurar nombre de columna
            $table->renameColumn('id_number', 'ruc_cedula');
        });

        Schema::table('clientes', function (Blueprint $table) {
            // Restaurar columnas originales
            $table->unsignedBigInteger('usuario_id')->nullable()->after('cliente_id');
            $table->string('tipo')->default('natural')->after('telefono');
            
            // Restaurar la foreign key
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('cascade');
        });
    }
};
