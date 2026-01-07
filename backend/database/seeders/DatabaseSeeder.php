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

        // Crear permisos y roles
        $this->call(PermissionSeeder::class);

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

        // Crear clientes según el nuevo modelo
        for ($i = 0; $i < 8; $i++) {
            Cliente::create([
                'id_type' => fake()->randomElement(['RUC', 'CEDULA', 'PASAPORTE']),
                'id_number' => fake()->unique()->numerify('###########'),
                'razon_social' => fake()->company(), // Siempre asigna un valor
                'direccion' => fake()->address(),
                'telefono' => fake()->phoneNumber(),
                'email' => fake()->optional()->safeEmail(),
                'is_active' => true,
                'notes' => fake()->optional()->sentence(),
            ]);
        }

        // Crear proveedores con sus usuarios
        for ($i = 0; $i < 5; $i++) {
            Proveedor::create([
                'id_type' => fake()->randomElement(['RUC', 'CEDULA', 'PASAPORTE']),
                'id_number' => fake()->unique()->numerify('##############'),
                'razon_social' => fake()->company(),
                'nombre_comercial' => fake()->optional()->companySuffix(),
                'direccion' => fake()->address(),
                'telefono' => fake()->phoneNumber(),
                'sitio_web' => fake()->optional()->url(),
                'email' => fake()->optional()->safeEmail(),
                'contacto_nombre' => fake()->optional()->name(),
                'contacto_telefono' => fake()->optional()->phoneNumber(),
                'contacto_email' => fake()->optional()->safeEmail(),
                'tipo_proveedor' => fake()->randomElement(['BIENES', 'SERVICIOS', 'MIXTO']),
                'banco' => fake()->optional()->company(),
                'cuenta_bancaria' => fake()->optional()->bankAccountNumber(),
                'tipo_cuenta' => fake()->optional()->randomElement(['AHORROS', 'CORRIENTE']),
                'is_active' => true,
                'notes' => fake()->optional()->sentence(),
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

        // Crear categorías
        $this->call(CategoriaSeeder::class);

        // Crear impuestos
        $this->call(ImpuestoSeeder::class);

        // Crear productos
        $this->call(ProductoSeeder::class);

        // Crear compras y detalles
        $this->call(CompraSeeder::class);

        // Crear consumidor final
        $this->call(ConsumidorFinalSeeder::class);

        // Crear facturas y detalles
        $this->call(FacturaSeeder::class);

        // Crear egresos
        $this->call(EgresoSeeder::class);

        // Crear pagos
        $this->call(PagoSeeder::class);

        $this->command->info('✅ Base de datos poblada exitosamente');
    }
}
