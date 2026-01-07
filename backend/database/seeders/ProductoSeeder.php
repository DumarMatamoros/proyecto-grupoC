<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Producto;
use Illuminate\Database\Seeder;

class ProductoSeeder extends Seeder
{
    /**
     * Seed de productos de ejemplo.
     */
    public function run(): void
    {
        $categorias = Categoria::pluck('categoria_id')->toArray();

        if (empty($categorias)) {
            $this->command->warn('⚠️ No hay categorías disponibles. Ejecuta CategoriaSeeder primero.');
            return;
        }

        $productos = [
            [
                'codigo_principal' => 'ELECT-001',
                'codigo_barras' => '1234567890001',
                'nombre' => 'Monitor LED 24"',
                'descripcion' => 'Monitor LED Full HD 24 pulgadas',
                'precio_costo' => 120.00,
                'precio_unitario' => 199.99,
                'stock_actual' => 15,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[0],
            ],
            [
                'codigo_principal' => 'COMPU-001',
                'codigo_barras' => '1234567890002',
                'nombre' => 'Laptop HP Core i5',
                'descripcion' => 'Laptop HP con procesador Intel Core i5, 8GB RAM',
                'precio_costo' => 450.00,
                'precio_unitario' => 699.99,
                'stock_actual' => 8,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[1],
            ],
            [
                'codigo_principal' => 'ACCE-001',
                'codigo_barras' => '1234567890003',
                'nombre' => 'Mouse Logitech Inalámbrico',
                'descripcion' => 'Mouse inalámbrico con receptor USB',
                'precio_costo' => 8.50,
                'precio_unitario' => 19.99,
                'stock_actual' => 50,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[2],
            ],
            [
                'codigo_principal' => 'ACCE-002',
                'codigo_barras' => '1234567890004',
                'nombre' => 'Teclado Mecánico RGB',
                'descripcion' => 'Teclado mecánico con retroiluminación RGB',
                'precio_costo' => 35.00,
                'precio_unitario' => 89.99,
                'stock_actual' => 20,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[2],
            ],
            [
                'codigo_principal' => 'ACCE-003',
                'codigo_barras' => '1234567890005',
                'nombre' => 'Cable HDMI 2.0',
                'descripcion' => 'Cable HDMI 2.0 de 2 metros',
                'precio_costo' => 2.50,
                'precio_unitario' => 8.99,
                'stock_actual' => 100,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[2],
            ],
            [
                'codigo_principal' => 'ROPA-001',
                'codigo_barras' => '1234567890006',
                'nombre' => 'Camiseta Básica Azul',
                'descripcion' => 'Camiseta 100% algodón color azul',
                'precio_costo' => 4.00,
                'precio_unitario' => 14.99,
                'stock_actual' => 200,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[3],
            ],
            [
                'codigo_principal' => 'ROPA-002',
                'codigo_barras' => '1234567890007',
                'nombre' => 'Pantalón Jeans',
                'descripcion' => 'Pantalón jeans color azul oscuro',
                'precio_costo' => 12.00,
                'precio_unitario' => 39.99,
                'stock_actual' => 80,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[3],
            ],
            [
                'codigo_principal' => 'ALIM-001',
                'codigo_barras' => '1234567890008',
                'nombre' => 'Aceite de Oliva 500ml',
                'descripcion' => 'Aceite de oliva virgen extra 500ml',
                'precio_costo' => 3.50,
                'precio_unitario' => 9.99,
                'stock_actual' => 120,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[4],
            ],
            [
                'codigo_principal' => 'HIGIENE-001',
                'codigo_barras' => '1234567890009',
                'nombre' => 'Jabón Líquido 250ml',
                'descripcion' => 'Jabón líquido para manos 250ml',
                'precio_costo' => 1.50,
                'precio_unitario' => 4.99,
                'stock_actual' => 300,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[5],
            ],
            [
                'codigo_principal' => 'HERR-001',
                'codigo_barras' => '1234567890010',
                'nombre' => 'Martillo de Goma',
                'descripcion' => 'Martillo con cabeza de goma',
                'precio_costo' => 5.00,
                'precio_unitario' => 14.99,
                'stock_actual' => 45,
                'iva_aplica' => true,
                'ice_aplica' => false,
                'categoria_id' => $categorias[6],
            ],
        ];

        foreach ($productos as $producto) {
            Producto::firstOrCreate(
                ['codigo_principal' => $producto['codigo_principal']],
                $producto
            );
        }

        $this->command->info('✅ Productos creados exitosamente');
    }
}
