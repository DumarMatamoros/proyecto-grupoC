<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Añade campos adicionales para facturación Ecuador y hace nullable las FK
     */
    public function up(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            // Hacer nullable las FK para permitir consumidor final
            $table->unsignedBigInteger('cliente_id')->nullable()->change();
            $table->unsignedBigInteger('empleado_id')->nullable()->change();
            
            // Campos adicionales para Ecuador
            $table->string('numero_factura', 15)->nullable()->after('clave_acceso');
            $table->string('cedula_cliente', 13)->nullable()->after('estado');
            $table->string('nombre_cliente')->nullable()->after('cedula_cliente');
            $table->string('direccion_cliente')->nullable()->after('nombre_cliente');
            $table->string('telefono_cliente', 15)->nullable()->after('direccion_cliente');
            $table->string('email_cliente')->nullable()->after('telefono_cliente');
            
            // Campos de descuento
            $table->decimal('descuento', 12, 2)->default(0)->after('total_sin_impuestos');
            
            // Forma de pago
            $table->string('forma_pago')->default('efectivo')->after('total');
            
            // Observaciones
            $table->text('observaciones')->nullable()->after('forma_pago');
            
            // Usuario que creó la factura
            $table->unsignedBigInteger('usuario_id')->nullable()->after('sucursal_id');
            $table->foreign('usuario_id')->references('usuario_id')->on('usuarios')->onDelete('set null');
        });

        // Actualizar detalle_facturas para incluir IVA por producto
        Schema::table('detalle_facturas', function (Blueprint $table) {
            $table->boolean('iva_aplica')->default(true)->after('precio_unitario');
            $table->decimal('porcentaje_iva', 5, 2)->default(15)->after('iva_aplica');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->dropForeign(['usuario_id']);
            $table->dropColumn([
                'numero_factura',
                'cedula_cliente',
                'nombre_cliente',
                'direccion_cliente',
                'telefono_cliente',
                'email_cliente',
                'descuento',
                'forma_pago',
                'observaciones',
                'usuario_id',
            ]);
        });

        Schema::table('detalle_facturas', function (Blueprint $table) {
            $table->dropColumn(['iva_aplica', 'porcentaje_iva']);
        });
    }
};
