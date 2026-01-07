<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Refactorización de la tabla proveedores.
 * 
 * CAMBIO DE ARQUITECTURA:
 * - Antes: Proveedores estaban vinculados a Usuarios (login)
 * - Ahora: Proveedores son entidades externas (sin login)
 * 
 * Esta migración cumple con los requisitos del SRI (Ecuador) para
 * compras y retenciones.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero actualizar valores nulos en razon_social
        DB::table('proveedores')
            ->whereNull('razon_social')
            ->update(['razon_social' => 'SIN NOMBRE']);

        // Eliminar la foreign key existente
        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropForeign(['usuario_id']);
        });

        // Modificar la estructura de la tabla
        Schema::table('proveedores', function (Blueprint $table) {
            // Eliminar columna usuario_id (ya no se vincula a usuarios)
            $table->dropColumn('usuario_id');
            
            // Renombrar ruc a id_number para consistencia con clientes
            $table->renameColumn('ruc', 'id_number');
        });

        // Agregar nuevas columnas según normativa SRI
        Schema::table('proveedores', function (Blueprint $table) {
            // Tipo de identificación (requerido por SRI)
            $table->enum('id_type', [
                'RUC',           // Registro Único de Contribuyentes (13 dígitos)
                'CEDULA',        // Cédula de identidad (10 dígitos) - persona natural
                'PASAPORTE',     // Pasaporte (extranjeros)
            ])->default('RUC')->after('proveedor_id');
            
            // Nombre comercial (opcional, diferente de razón social)
            $table->string('nombre_comercial')->nullable()->after('razon_social');
            
            // Email para comunicaciones
            $table->string('email')->nullable()->after('sitio_web');
            
            // Persona de contacto
            $table->string('contacto_nombre')->nullable()->after('email');
            $table->string('contacto_telefono')->nullable()->after('contacto_nombre');
            $table->string('contacto_email')->nullable()->after('contacto_telefono');
            
            // Tipo de proveedor
            $table->enum('tipo_proveedor', [
                'BIENES',        // Proveedor de bienes/mercadería
                'SERVICIOS',     // Proveedor de servicios
                'MIXTO',         // Ambos
            ])->default('BIENES')->after('contacto_email');
            
            // Datos bancarios para pagos
            $table->string('banco')->nullable()->after('tipo_proveedor');
            $table->string('cuenta_bancaria')->nullable()->after('banco');
            $table->enum('tipo_cuenta', ['AHORROS', 'CORRIENTE'])->nullable()->after('cuenta_bancaria');
            
            // Estado activo/inactivo
            $table->boolean('is_active')->default(true)->after('tipo_cuenta');
            
            // Notas adicionales
            $table->text('notes')->nullable()->after('is_active');
        });

        // Actualizar la columna razon_social para que sea obligatoria
        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('razon_social')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            // Eliminar nuevas columnas
            $table->dropColumn([
                'id_type', 
                'nombre_comercial',
                'email',
                'contacto_nombre',
                'contacto_telefono', 
                'contacto_email',
                'tipo_proveedor',
                'banco',
                'cuenta_bancaria',
                'tipo_cuenta',
                'is_active', 
                'notes'
            ]);
            
            // Restaurar nombre de columna
            $table->renameColumn('id_number', 'ruc');
        });

        Schema::table('proveedores', function (Blueprint $table) {
            // Restaurar columnas originales
            $table->unsignedBigInteger('usuario_id')->nullable()->after('proveedor_id');
            
            // Restaurar la foreign key
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('cascade');
        });
    }
};
