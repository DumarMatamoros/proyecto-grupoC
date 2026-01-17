<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para agregar configuraciones adicionales del módulo POS
 * - Datos de empresa ampliados
 * - Configuraciones de impresión/tickets
 * - Configuraciones de facturación extendidas
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // La tabla configuraciones ya existe, solo agregamos el seeder con nuevos valores
        // Esta migración sirve como registro de las nuevas configuraciones del módulo POS
        
        // Si la tabla no tiene ciertos campos, los agregamos
        if (!Schema::hasColumn('configuraciones', 'orden')) {
            Schema::table('configuraciones', function (Blueprint $table) {
                $table->integer('orden')->default(0)->after('editable');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('configuraciones', 'orden')) {
            Schema::table('configuraciones', function (Blueprint $table) {
                $table->dropColumn('orden');
            });
        }
    }
};
