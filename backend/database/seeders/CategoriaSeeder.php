<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    /**
     * Seed de categorías de productos.
     */
    public function run(): void
    {
        $categorias = [
            [
                'nombre' => 'Electrónica',
                'descripcion' => 'Productos electrónicos y accesorios',
            ],
            [
                'nombre' => 'Computadoras',
                'descripcion' => 'Computadoras, laptops y equipos de cómputo',
            ],
            [
                'nombre' => 'Accesorios',
                'descripcion' => 'Accesorios tecnológicos y periféricos',
            ],
            [
                'nombre' => 'Ropa y Textiles',
                'descripcion' => 'Prendas de vestir y textiles diversos',
            ],
            [
                'nombre' => 'Alimentos y Bebidas',
                'descripcion' => 'Productos alimenticios y bebidas',
            ],
            [
                'nombre' => 'Higiene y Limpieza',
                'descripcion' => 'Artículos de higiene personal y limpieza',
            ],
            [
                'nombre' => 'Herramientas',
                'descripcion' => 'Herramientas manuales y eléctricas',
            ],
            [
                'nombre' => 'Muebles',
                'descripcion' => 'Muebles para hogar y oficina',
            ],
        ];

        foreach ($categorias as $categoria) {
            Categoria::firstOrCreate(
                ['nombre' => $categoria['nombre']],
                $categoria
            );
        }

        $this->command->info('✅ Categorías creadas exitosamente');
    }
}
