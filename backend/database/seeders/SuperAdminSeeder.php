<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Administrador;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Crea el usuario Super Administrador por defecto.
     * 
     * Este seeder debe ejecutarse al inicializar la base de datos.
     * El super admin puede crear otros usuarios desde el panel.
     */
    public function run(): void
    {
        // Verificar si ya existe el super admin
        $existingAdmin = User::where('email', 'admin@sistema.com')->first();

        if ($existingAdmin) {
            // Asegurar que tenga el rol asignado
            if (!$existingAdmin->hasRole('super_admin')) {
                $superAdminRole = Role::where('name', 'super_admin')->first();
                if ($superAdminRole) {
                    $existingAdmin->assignRole($superAdminRole);
                    $this->command->info('Rol super_admin asignado al admin existente.');
                }
            }
            $this->command->info('Super Administrador ya existe. Saltando...');
            return;
        }

        // Crear el usuario super administrador
        $superAdmin = User::create([
            'nombre' => 'Super Administrador',
            'email' => 'admin@sistema.com',
            'password' => Hash::make('Admin123!'),
            'tipo' => 'administrador',
            'must_change_password' => true, // Forzar cambio en primer login
        ]);

        // Asignar rol de super_admin con spatie
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole) {
            $superAdmin->assignRole($superAdminRole);
        }

        // Crear registro en la tabla administradores
        Administrador::create([
            'usuario_id' => $superAdmin->usuario_id,
            'nivel' => 'super',
            'permisos' => json_encode([
                'usuarios' => true,
                'empleados' => true,
                'clientes' => true,
                'proveedores' => true,
                'productos' => true,
                'categorias' => true,
                'facturacion' => true,
                'reportes' => true,
                'configuracion' => true,
            ]),
        ]);

        $this->command->info('✅ Super Administrador creado exitosamente:');
        $this->command->info('   Email: admin@sistema.com');
        $this->command->info('   Contraseña temporal: Admin123!');
        $this->command->warn('   ⚠️  El usuario deberá cambiar la contraseña en el primer login.');
    }
}
