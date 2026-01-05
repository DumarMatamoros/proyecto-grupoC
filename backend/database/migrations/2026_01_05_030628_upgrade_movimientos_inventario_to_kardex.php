<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            // Agregar relación con lotes
            $table->unsignedBigInteger('lote_id')->nullable()->after('producto_id');
            $table->foreign('lote_id')
                  ->references('lote_id')
                  ->on('lotes')
                  ->onDelete('set null');

            // Tipo de documento que generó el movimiento
            $table->string('tipo_documento')->nullable()->after('tipo_movimiento');
            // COMPRA | FACTURA | AJUSTE | DEVOLUCION | MERMA

            $table->string('numero_documento')->nullable()->after('tipo_documento');

            // Separar entrada y salida
            $table->integer('cantidad_entrada')->default(0)->after('cantidad');
            $table->integer('cantidad_salida')->default(0)->after('cantidad_entrada');

            // Stock después del movimiento
            $table->integer('stock_resultante')->default(0)->after('cantidad_salida');

            // Costo en ese momento
            $table->decimal('costo_unitario', 10, 2)->nullable()->after('stock_resultante');

            // Quién hizo el movimiento (auditoría)
            $table->unsignedBigInteger('usuario_id')->nullable()->after('referencia');
            $table->foreign('usuario_id')
                  ->references('usuario_id')
                  ->on('usuarios')
                  ->onDelete('set null');

            // Observaciones
            $table->text('observaciones')->nullable()->after('usuario_id');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_inventario', function (Blueprint $table) {
            $table->dropForeign(['lote_id']);
            $table->dropForeign(['usuario_id']);
            $table->dropColumn([
                'lote_id',
                'tipo_documento',
                'numero_documento',
                'cantidad_entrada',
                'cantidad_salida',
                'stock_resultante',
                'costo_unitario',
                'usuario_id',
                'observaciones'
            ]);
        });
    }
};