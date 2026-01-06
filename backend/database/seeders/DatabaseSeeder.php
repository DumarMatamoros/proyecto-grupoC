<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Empleado;
use App\Models\Cliente;
use App\Models\Proveedor;
use App\Models\Administrador;
use App\Models\Sucursal;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Cargar configuraciones primero
        $this->call(ConfiguracionSeeder::class);

        // Crear Super Administrador del sistema
        $this->call(SuperAdminSeeder::class);

        // Crear una sucursal por defecto
        $sucursal = Sucursal::create([
            'nombre' => 'Sucursal Principal',
            'direccion' => 'Av. Principal 123',
            'punto_emision' => '001',
        ]);

        // Crear un administrador específico para pruebas
        $admin = User::create([
            'nombre' => 'Admin Principal',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'tipo' => 'administrador',
        ]);

        // Crear registro en administradores
        Administrador::create([
            'usuario_id' => $admin->usuario_id,
            'nivel' => 'super',
            'permisos' => json_encode(['usuarios' => true, 'empleados' => true, 'clientes' => true, 'proveedores' => true]),
        ]);

        // Crear empleados con sus usuarios
        for ($i = 0; $i < 5; $i++) {
            $usuario = User::factory()->create([
                'tipo' => 'empleado'
            ]);
            
            Empleado::create([
                'usuario_id' => $usuario->usuario_id,
                'sucursal_id' => $sucursal->sucursal_id,
                'departamento' => fake()->randomElement(['Ventas', 'Administración', 'Logística']),
                'fecha_inicio' => fake()->dateTimeBetween('-3 years', 'now'),
            ]);
        }

        // Crear clientes con sus usuarios
        for ($i = 0; $i < 8; $i++) {
            $usuario = User::factory()->create([
                'tipo' => 'cliente'
            ]);
            
            Cliente::create([
                'usuario_id' => $usuario->usuario_id,
                'ruc_cedula' => fake()->unique()->numerify('###########'),
                'razon_social' => fake()->optional()->company(),
                'direccion' => fake()->address(),
                'telefono' => fake()->phoneNumber(),
                'tipo' => fake()->randomElement(['natural', 'juridica']),
            ]);
        }

        // Crear proveedores con sus usuarios
        for ($i = 0; $i < 5; $i++) {
            $usuario = User::factory()->create([
                'tipo' => 'proveedor'
            ]);
            
            Proveedor::create([
                'usuario_id' => $usuario->usuario_id,
                'ruc' => fake()->unique()->numerify('##############'),
                'razon_social' => fake()->company(),
                'direccion' => fake()->address(),
                'telefono' => fake()->phoneNumber(),
                'sitio_web' => fake()->optional()->url(),
            ]);
        }

        // Crear algunos administradores adicionales
        for ($i = 0; $i < 2; $i++) {
            $usuario = User::factory()->create([
                'tipo' => 'administrador'
            ]);
            
            Administrador::create([
                'usuario_id' => $usuario->usuario_id,
                'nivel' => fake()->randomElement(['moderador', 'editor']),
                'permisos' => json_encode(['usuarios' => true, 'reportes' => true]),
            ]);
        }
    }
}
