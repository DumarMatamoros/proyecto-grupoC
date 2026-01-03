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
        Schema::create('egresos', function (Blueprint $table) {
            $table->id('egreso_id');
            $table->date('fecha');
            $table->enum('motivo', ['desecho', 'vencido', 'dañado', 'perdida', 'ajuste', 'otro'])->default('desecho');
            $table->text('observaciones')->nullable();
            $table->integer('total_unidades')->default(0);
            $table->decimal('valor_total', 12, 2)->default(0);
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->unsignedBigInteger('sucursal_id')->nullable();
            $table->timestamps();

            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('set null');
            $table->foreign('sucursal_id')->references('sucursal_id')->on('sucursales')->onDelete('set null');
        });

        Schema::create('detalle_egresos', function (Blueprint $table) {
            $table->id('detalle_egreso_id');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->string('motivo_detalle')->nullable();
            $table->date('fecha_vencimiento')->nullable();
            $table->unsignedBigInteger('egreso_id');
            $table->unsignedBigInteger('producto_id');
            $table->timestamps();

            $table->foreign('egreso_id')->references('egreso_id')->on('egresos')->onDelete('cascade');
            $table->foreign('producto_id')->references('producto_id')->on('productos')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detalle_egresos');
        Schema::dropIfExists('egresos');
    }
};
