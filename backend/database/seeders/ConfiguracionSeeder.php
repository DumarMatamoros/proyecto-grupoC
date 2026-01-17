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
        /*
        |--------------------------------------------------------------------------
        | CONFIGURACIONES DE EMPRESA (grupo: empresa)
        |--------------------------------------------------------------------------
        */
        Configuracion::updateOrCreate(
            ['clave' => 'nombre_empresa'],
            [
                'valor' => 'Mi Empresa Ecuador',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'Nombre comercial de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'ruc_empresa'],
            [
                'valor' => '1234567890001',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'RUC o identificación legal de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'direccion_empresa'],
            [
                'valor' => 'Av. Principal 123, Quito, Ecuador',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'Dirección física de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'telefono_empresa'],
            [
                'valor' => '+593 2 123 4567',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'Teléfono de contacto de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'email_empresa'],
            [
                'valor' => 'info@empresa.com',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'Email principal de la empresa',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'logo_empresa'],
            [
                'valor' => '',
                'tipo' => 'string',
                'grupo' => 'empresa',
                'descripcion' => 'URL del logo de la empresa',
                'editable' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CONFIGURACIONES DE FACTURACIÓN E IMPUESTOS (grupo: facturacion)
        |--------------------------------------------------------------------------
        */
        Configuracion::updateOrCreate(
            ['clave' => 'iva_porcentaje'],
            [
                'valor' => '15',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Porcentaje de IVA por defecto (0-100)',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'ice_porcentaje'],
            [
                'valor' => '0',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Porcentaje de ICE por defecto (0-100)',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'moneda_simbolo'],
            [
                'valor' => '$',
                'tipo' => 'string',
                'grupo' => 'facturacion',
                'descripcion' => 'Símbolo de moneda a mostrar',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'numero_factura_prefijo'],
            [
                'valor' => '001-001',
                'tipo' => 'string',
                'grupo' => 'facturacion',
                'descripcion' => 'Prefijo para números de factura (ej: 001-001)',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'descuento_maximo'],
            [
                'valor' => '20',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Descuento máximo permitido (%)',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'stock_minimo_alerta'],
            [
                'valor' => '10',
                'tipo' => 'numeric',
                'grupo' => 'facturacion',
                'descripcion' => 'Límite de stock bajo para alertas',
                'editable' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CONFIGURACIONES DE IMPRESIÓN Y TICKETS (grupo: impresion)
        |--------------------------------------------------------------------------
        */
        Configuracion::updateOrCreate(
            ['clave' => 'ticket_encabezado'],
            [
                'valor' => '*** COMPROBANTE DE VENTA ***',
                'tipo' => 'string',
                'grupo' => 'impresion',
                'descripcion' => 'Texto de encabezado del ticket',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'ticket_pie_pagina'],
            [
                'valor' => '¡Gracias por su compra! Vuelva pronto.',
                'tipo' => 'string',
                'grupo' => 'impresion',
                'descripcion' => 'Mensaje al pie del ticket',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'ticket_mostrar_logo'],
            [
                'valor' => '1',
                'tipo' => 'boolean',
                'grupo' => 'impresion',
                'descripcion' => 'Mostrar logo en ticket de impresión',
                'editable' => true,
            ]
        );

        Configuracion::updateOrCreate(
            ['clave' => 'imprimir_automatico'],
            [
                'valor' => '0',
                'tipo' => 'boolean',
                'grupo' => 'impresion',
                'descripcion' => 'Imprimir ticket automáticamente al cobrar',
                'editable' => true,
            ]
        );

        echo "✅ Configuraciones del módulo POS creadas/actualizadas exitosamente\n";
    }
}
