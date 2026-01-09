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
        Schema::table('productos', function (Blueprint $table) {
            // Unidad de medida
            if (!Schema::hasColumn('productos', 'unidad_medida')) {
                $table->enum('unidad_medida', ['unidad', 'kg', 'lb', 'caja', 'paquete', 'litro', 'metro', 'docena'])
                      ->default('unidad')
                      ->after('descripcion');
            }
            
            // Marca del producto
            if (!Schema::hasColumn('productos', 'marca')) {
                $table->string('marca', 100)->nullable()->after('unidad_medida');
            }
            
            // Proveedor principal (referencia)
            if (!Schema::hasColumn('productos', 'proveedor_principal_id')) {
                $table->unsignedBigInteger('proveedor_principal_id')->nullable()->after('marca');
                $table->foreign('proveedor_principal_id')
                      ->references('proveedor_id')
                      ->on('proveedores')
                      ->onDelete('set null');
            }
            
            // SKU - Código interno alterno
            if (!Schema::hasColumn('productos', 'sku')) {
                $table->string('sku', 50)->nullable()->unique()->after('codigo_barras');
            }
            
            // Ubicación en bodega
            if (!Schema::hasColumn('productos', 'ubicacion_bodega')) {
                $table->string('ubicacion_bodega', 100)->nullable()->after('proveedor_principal_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropForeign(['proveedor_principal_id']);
            $table->dropColumn([
                'unidad_medida',
                'marca',
                'proveedor_principal_id',
                'sku',
                'ubicacion_bodega'
            ]);
        });
    }
};
