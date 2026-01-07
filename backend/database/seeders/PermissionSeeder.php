<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Estructura de permisos por módulo.
     * 
     * Nomenclatura: modulo.accion
     * Acciones estándar: ver, crear, editar, eliminar
     */
    private array $modules = [
        'inventario' => [
            'label' => 'Inventario',
            'permissions' => [
                'ver' => 'Ver productos y stock',
                'crear' => 'Crear productos',
                'editar' => 'Editar productos',
                'eliminar' => 'Eliminar productos',
            ],
        ],
        'categorias' => [
            'label' => 'Categorías',
            'permissions' => [
                'ver' => 'Ver categorías',
                'crear' => 'Crear categorías',
                'editar' => 'Editar categorías',
                'eliminar' => 'Eliminar categorías',
            ],
        ],
        'compras' => [
            'label' => 'Compras/Ingresos',
            'permissions' => [
                'ver' => 'Ver compras e ingresos',
                'crear' => 'Registrar compras',
                'editar' => 'Editar compras',
                'eliminar' => 'Eliminar compras',
            ],
        ],
        'egresos' => [
            'label' => 'Egresos/Desechos',
            'permissions' => [
                'ver' => 'Ver egresos',
                'crear' => 'Registrar egresos',
                'editar' => 'Editar egresos',
                'eliminar' => 'Eliminar egresos',
            ],
        ],
        'facturacion' => [
            'label' => 'Facturación',
            'permissions' => [
                'ver' => 'Ver facturas',
                'crear' => 'Crear facturas',
                'editar' => 'Editar facturas',
                'eliminar' => 'Anular facturas',
            ],
        ],
        'usuarios' => [
            'label' => 'Usuarios',
            'permissions' => [
                'ver' => 'Ver usuarios',
                'crear' => 'Crear usuarios',
                'editar' => 'Editar usuarios',
                'eliminar' => 'Eliminar usuarios',
            ],
        ],
        'roles' => [
            'label' => 'Roles y Permisos',
            'permissions' => [
                'ver' => 'Ver roles y permisos',
                'crear' => 'Crear roles',
                'editar' => 'Editar roles y permisos',
                'eliminar' => 'Eliminar roles',
            ],
        ],
        'reportes' => [
            'label' => 'Reportes',
            'permissions' => [
                'ver' => 'Ver reportes',
                'exportar' => 'Exportar reportes',
            ],
        ],
        'configuracion' => [
            'label' => 'Configuración',
            'permissions' => [
                'ver' => 'Ver configuración',
                'editar' => 'Editar configuración del sistema',
            ],
        ],
    ];

    /**
     * Roles predefinidos del sistema con sus permisos.
     */
    private array $roles = [
        'super_admin' => [
            'label' => 'Super Administrador',
            'description' => 'Acceso total al sistema',
            'permissions' => '*', // Todos los permisos
        ],
        'administrador' => [
            'label' => 'Administrador',
            'description' => 'Gestión general del sistema',
            'permissions' => [
                'inventario.*',
                'categorias.*',
                'compras.*',
                'egresos.*',
                'facturacion.*',
                'usuarios.ver',
                'usuarios.crear',
                'usuarios.editar',
                'reportes.*',
                'configuracion.ver',
            ],
        ],
        'empleado' => [
            'label' => 'Empleado',
            'description' => 'Operaciones diarias',
            'permissions' => [
                'inventario.ver',
                'inventario.editar',
                'categorias.ver',
                'compras.ver',
                'compras.crear',
                'egresos.ver',
                'egresos.crear',
                'facturacion.ver',
                'facturacion.crear',
                'reportes.ver',
            ],
        ],
        'proveedor' => [
            'label' => 'Proveedor',
            'description' => 'Acceso limitado para proveedores',
            'permissions' => [
                'compras.ver',
            ],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar cache de permisos
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command->info('🔐 Creando permisos del sistema...');

        // Crear todos los permisos
        $allPermissions = [];
        foreach ($this->modules as $moduleKey => $moduleConfig) {
            foreach ($moduleConfig['permissions'] as $action => $description) {
                $permissionName = "{$moduleKey}.{$action}";
                
                $permission = Permission::firstOrCreate(
                    ['name' => $permissionName, 'guard_name' => 'web'],
                    ['name' => $permissionName, 'guard_name' => 'web']
                );
                
                $allPermissions[$permissionName] = $permission;
                $this->command->line("   ✓ {$permissionName}");
            }
        }

        $this->command->info('');
        $this->command->info('👥 Creando roles del sistema...');

        // Crear roles y asignar permisos
        foreach ($this->roles as $roleKey => $roleConfig) {
            $role = Role::firstOrCreate(
                ['name' => $roleKey, 'guard_name' => 'web'],
                ['name' => $roleKey, 'guard_name' => 'web']
            );

            // Asignar permisos
            if ($roleConfig['permissions'] === '*') {
                // Super Admin: todos los permisos
                $role->syncPermissions(array_values($allPermissions));
                $this->command->line("   ✓ {$roleKey} → TODOS los permisos");
            } else {
                $permissionsToAssign = [];
                foreach ($roleConfig['permissions'] as $permPattern) {
                    if (str_ends_with($permPattern, '.*')) {
                        // Patrón con wildcard: módulo.*
                        $module = str_replace('.*', '', $permPattern);
                        foreach ($allPermissions as $permName => $perm) {
                            if (str_starts_with($permName, "{$module}.")) {
                                $permissionsToAssign[] = $perm;
                            }
                        }
                    } else {
                        // Permiso específico
                        if (isset($allPermissions[$permPattern])) {
                            $permissionsToAssign[] = $allPermissions[$permPattern];
                        }
                    }
                }
                $role->syncPermissions($permissionsToAssign);
                $this->command->line("   ✓ {$roleKey} → " . count($permissionsToAssign) . " permisos");
            }
        }

        $this->command->info('');
        $this->command->info('✅ Permisos y roles creados exitosamente.');
        $this->command->info('   Total permisos: ' . count($allPermissions));
        $this->command->info('   Total roles: ' . count($this->roles));
    }

    /**
     * Obtener la estructura de módulos (para uso en API).
     */
    public static function getModulesStructure(): array
    {
        return (new self())->modules;
    }

    /**
     * Obtener la estructura de roles (para uso en API).
     */
    public static function getRolesStructure(): array
    {
        return (new self())->roles;
    }
}
