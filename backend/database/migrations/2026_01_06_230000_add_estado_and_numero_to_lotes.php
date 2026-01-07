<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lotes', function (Blueprint $table) {
            // Número de lote legible (Lote 1, Lote 2, etc.) - autogenerado por producto
            $table->string('numero_lote', 50)->nullable()->after('producto_id');
            
            // Estado del lote: activo, agotado, dañado, vencido
            $table->enum('estado', ['activo', 'agotado', 'danado', 'vencido'])
                  ->default('activo')
                  ->after('fecha_vencimiento');
            
            // Motivo de baja (si el lote fue dado de baja por daño u otra razón)
            $table->text('motivo_baja')->nullable()->after('estado');
            
            // Fecha de baja
            $table->timestamp('fecha_baja')->nullable()->after('motivo_baja');
            
            // Referencia de compra (para trazabilidad)
            $table->unsignedBigInteger('compra_id')->nullable()->after('fecha_baja');
        });
    }

    public function down(): void
    {
        Schema::table('lotes', function (Blueprint $table) {
            $table->dropColumn(['numero_lote', 'estado', 'motivo_baja', 'fecha_baja', 'compra_id']);
        });
    }
};
