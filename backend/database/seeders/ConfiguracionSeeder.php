<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Configuraciones de Facturación
        Configuracion::updateOrCreate(
            ['clave' => 'iva_porcentaje'],
            [
                'valor' => '12',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Porcentaje de IVA a aplicar en facturas (0-100)',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'numero_factura_prefijo'],
            [
                'valor' => 'FAC',
                'tipo' => 'string',
                'grupo' => 'facturacion',
                'descripcion' => 'Prefijo para números de factura',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'descuento_maximo'],
            [
                'valor' => '20',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Descuento máximo permitido (0-100)',
                'editable' => true,
            ]
        );

        // Configuraciones del Sistema
        Configuracion::updateOrCreate(
            ['clave' => 'nombre_empresa'],
            [
                'valor' => 'Mi Empresa Ecuador',
                'tipo' => 'string',
                'grupo' => 'sistema',
                'descripcion' => 'Nombre de la empresa para reportes',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'ruc_empresa'],
            [
                'valor' => '1234567890001',
                'tipo' => 'string',
                'grupo' => 'sistema',
                'descripcion' => 'RUC de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'email_empresa'],
            [
                'valor' => 'info@empresa.com',
                'tipo' => 'string',
                'grupo' => 'sistema',
                'descripcion' => 'Email principal de la empresa',
                'editable' => true,
            ]
        );

        echo "✅ Configuraciones creadas/actualizadas exitosamente\n";
    }
}
