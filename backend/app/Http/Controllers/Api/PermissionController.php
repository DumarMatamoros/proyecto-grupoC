<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Estructura de módulos para la matriz de permisos.
     */
    private array $modules = [
        'inventario' => [
            'label' => 'Inventario',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'categorias' => [
            'label' => 'Categorías',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'compras' => [
            'label' => 'Compras/Ingresos',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'egresos' => [
            'label' => 'Egresos/Desechos',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'facturacion' => [
            'label' => 'Facturación',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'usuarios' => [
            'label' => 'Usuarios',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'roles' => [
            'label' => 'Roles y Permisos',
            'actions' => ['ver', 'crear', 'editar', 'eliminar'],
        ],
        'reportes' => [
            'label' => 'Reportes',
            'actions' => ['ver', 'exportar'],
        ],
        'configuracion' => [
            'label' => 'Configuración',
            'actions' => ['ver', 'editar'],
        ],
    ];

    /**
     * Labels para las acciones.
     */
    private array $actionLabels = [
        'ver' => 'Ver',
        'crear' => 'Crear',
        'editar' => 'Editar',
        'eliminar' => 'Eliminar',
        'exportar' => 'Exportar',
    ];

    /**
     * Listar todos los roles con sus permisos.
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos
            if (!$this->canManagePermissions($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para gestionar roles',
                ], 403);
            }

            $roles = Role::with('permissions')->get()->map(function ($role) use ($user) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $this->getRoleLabel($role->name),
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                    'users_count' => User::role($role->name)->count(),
                    'is_protected' => $role->name === 'super_admin',
                    'can_edit' => $this->canEditRole($user, $role),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'roles' => $roles,
                    'modules' => $this->getModulesMatrix(),
                    'action_labels' => $this->actionLabels,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estructura de la matriz de permisos.
     */
    public function getMatrix(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->canManagePermissions($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para ver la matriz',
                ], 403);
            }

            // Obtener todos los permisos disponibles
            $allPermissions = Permission::all()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ];
            });

            // Obtener roles con sus permisos
            $roles = Role::with('permissions')->get()->map(function ($role) use ($user) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $this->getRoleLabel($role->name),
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                    'permissions_count' => $role->permissions->count(),
                    'is_protected' => $role->name === 'super_admin',
                    'can_edit' => $this->canEditRole($user, $role),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'roles' => $roles,
                    'permissions' => $allPermissions,
                    'modules' => $this->getModulesMatrix(),
                    'all_permissions' => $allPermissions->pluck('name')->toArray(),
                    'action_labels' => $this->actionLabels,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener matriz de permisos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar permisos de un rol.
     */
    public function updateRolePermissions(Request $request, $roleId)
    {
        try {
            $user = $request->user();
            $role = Role::findOrFail($roleId);

            // Verificar permisos
            if (!$this->canManagePermissions($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para gestionar roles',
                ], 403);
            }

            // No permitir editar super_admin
            if ($role->name === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar el rol Super Administrador',
                ], 403);
            }

            // Verificar si puede editar este rol
            if (!$this->canEditRole($user, $role)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para editar este rol',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'permissions' => 'required|array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $requestedPermissions = $request->permissions;

            // Si no es super_admin, validar que no asigne permisos que no tiene
            if (!$this->isSuperAdmin($user)) {
                $userPermissions = $user->getAllPermissions()->pluck('name')->toArray();
                $invalidPermissions = array_diff($requestedPermissions, $userPermissions);

                if (!empty($invalidPermissions)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puede asignar permisos que usted no posee',
                        'invalid_permissions' => $invalidPermissions,
                    ], 403);
                }
            }

            // Sincronizar permisos
            $role->syncPermissions($requestedPermissions);

            return response()->json([
                'success' => true,
                'message' => 'Permisos actualizados correctamente',
                'data' => [
                    'role' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar permisos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear un nuevo rol.
     */
    public function createRole(Request $request)
    {
        try {
            $user = $request->user();

            if (!$this->canManagePermissions($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para crear roles',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:50|unique:roles,name',
                'permissions' => 'array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Crear rol
            $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

            // Asignar permisos si se proporcionan
            if ($request->has('permissions')) {
                $permissions = $request->permissions;

                // Validar que no asigne permisos que no tiene
                if (!$this->isSuperAdmin($user)) {
                    $userPermissions = $user->getAllPermissions()->pluck('name')->toArray();
                    $permissions = array_intersect($permissions, $userPermissions);
                }

                $role->syncPermissions($permissions);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rol creado correctamente',
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear rol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar un rol.
     */
    public function deleteRole(Request $request, $roleId)
    {
        try {
            $user = $request->user();
            $role = Role::findOrFail($roleId);

            if (!$this->canManagePermissions($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para eliminar roles',
                ], 403);
            }

            // Roles protegidos
            $protectedRoles = ['super_admin', 'administrador', 'empleado'];
            if (in_array($role->name, $protectedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un rol del sistema',
                ], 403);
            }

            // Verificar que no tenga usuarios asignados
            $usersCount = User::role($role->name)->count();
            if ($usersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "No se puede eliminar el rol porque tiene {$usersCount} usuario(s) asignado(s)",
                ], 400);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar rol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Asignar rol a un usuario.
     */
    public function assignRoleToUser(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();
            $targetUser = User::findOrFail($userId);

            if (!$this->canManagePermissions($currentUser)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para asignar roles',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'role' => 'required|string|exists:roles,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $roleName = $request->role;

            // No permitir asignar super_admin excepto por otro super_admin
            if ($roleName === 'super_admin' && !$this->isSuperAdmin($currentUser)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo un Super Administrador puede asignar este rol',
                ], 403);
            }

            // Sincronizar rol (reemplaza roles anteriores)
            $targetUser->syncRoles([$roleName]);

            return response()->json([
                'success' => true,
                'message' => 'Rol asignado correctamente',
                'data' => [
                    'user_id' => $targetUser->usuario_id,
                    'role' => $roleName,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar rol',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================

    /**
     * Verificar si el usuario puede gestionar permisos.
     */
    private function canManagePermissions(User $user): bool
    {
        // Super admin siempre puede
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        // Verificar permiso específico
        return $user->hasPermissionTo('roles.editar');
    }

    /**
     * Verificar si es super admin.
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super_admin') || 
               ($user->tipo === 'administrador' && $user->administrador?->nivel === 'super');
    }

    /**
     * Verificar si puede editar un rol específico.
     */
    private function canEditRole(User $user, Role $role): bool
    {
        // Super admin puede editar todo excepto super_admin
        if ($this->isSuperAdmin($user)) {
            return $role->name !== 'super_admin';
        }

        // No puede editar super_admin ni administrador
        if (in_array($role->name, ['super_admin', 'administrador'])) {
            return false;
        }

        // Puede editar roles inferiores
        return true;
    }

    /**
     * Obtener label del rol.
     */
    private function getRoleLabel(string $roleName): string
    {
        $labels = [
            'super_admin' => 'Super Administrador',
            'administrador' => 'Administrador',
            'empleado' => 'Empleado',
            'proveedor' => 'Proveedor',
        ];

        return $labels[$roleName] ?? ucfirst($roleName);
    }

    /**
     * Obtener estructura de módulos para la matriz.
     */
    private function getModulesMatrix(): array
    {
        $matrix = [];

        foreach ($this->modules as $moduleKey => $moduleConfig) {
            $matrix[] = [
                'key' => $moduleKey,
                'label' => $moduleConfig['label'],
                'actions' => $moduleConfig['actions'],
                'permissions' => array_map(
                    fn($action) => "{$moduleKey}.{$action}",
                    $moduleConfig['actions']
                ),
            ];
        }

        return $matrix;
    }

    // ========================================
    // PERMISOS POR USUARIO (Estrategia Híbrida)
    // ========================================

    /**
     * Obtener matriz de permisos para un usuario específico.
     * 
     * Devuelve todos los permisos del sistema con información sobre:
     * - Si el permiso es heredado del rol del usuario
     * - Si el permiso fue asignado directamente al usuario
     * 
     * GET /api/admin/usuarios/{userId}/permissions-matrix
     */
    public function getUserPermissionsMatrix(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Verificar permisos
            if (!$this->canManagePermissions($currentUser)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para gestionar permisos de usuarios',
                ], 403);
            }

            // Obtener usuario objetivo
            $targetUser = User::findOrFail($userId);

            // Obtener los roles del usuario
            $userRoles = $targetUser->roles;
            $userRoleNames = $userRoles->pluck('name')->toArray();
            
            // Obtener permisos heredados de los roles
            $inheritedPermissions = [];
            $rolePermissionsMap = [];
            
            foreach ($userRoles as $role) {
                $rolePerms = $role->permissions->pluck('name')->toArray();
                $rolePermissionsMap[$role->name] = $rolePerms;
                $inheritedPermissions = array_merge($inheritedPermissions, $rolePerms);
            }
            $inheritedPermissions = array_unique($inheritedPermissions);

            // Obtener permisos asignados directamente al usuario
            $directPermissions = $targetUser->getDirectPermissions()->pluck('name')->toArray();

            // Obtener todos los permisos del sistema
            $allPermissions = Permission::all();

            // Construir la matriz de permisos agrupada por módulo
            $permissionsMatrix = [];

            foreach ($this->modules as $moduleKey => $moduleConfig) {
                $modulePermissions = [];

                foreach ($moduleConfig['actions'] as $action) {
                    $permissionName = "{$moduleKey}.{$action}";
                    $permission = $allPermissions->firstWhere('name', $permissionName);

                    if ($permission) {
                        // Determinar de qué rol(es) hereda este permiso
                        $inheritedFromRoles = [];
                        foreach ($rolePermissionsMap as $roleName => $rolePerms) {
                            if (in_array($permissionName, $rolePerms)) {
                                $inheritedFromRoles[] = $this->getRoleLabel($roleName);
                            }
                        }

                        $modulePermissions[] = [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'action' => $action,
                            'action_label' => $this->actionLabels[$action] ?? ucfirst($action),
                            'inherited_from_role' => in_array($permissionName, $inheritedPermissions),
                            'inherited_from_roles' => $inheritedFromRoles,
                            'assigned_directly' => in_array($permissionName, $directPermissions),
                        ];
                    }
                }

                if (!empty($modulePermissions)) {
                    $permissionsMatrix[] = [
                        'key' => $moduleKey,
                        'label' => $moduleConfig['label'],
                        'permissions' => $modulePermissions,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $targetUser->usuario_id,
                        'nombre' => $targetUser->nombre,
                        'email' => $targetUser->email,
                        'roles' => $userRoleNames,
                        'roles_labels' => array_map(fn($r) => $this->getRoleLabel($r), $userRoleNames),
                    ],
                    'permissions_matrix' => $permissionsMatrix,
                    'action_labels' => $this->actionLabels,
                    'summary' => [
                        'total_permissions' => $allPermissions->count(),
                        'inherited_count' => count($inheritedPermissions),
                        'direct_count' => count($directPermissions),
                        'effective_count' => count(array_unique(array_merge($inheritedPermissions, $directPermissions))),
                    ],
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener matriz de permisos del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar permisos directos de un usuario.
     * 
     * Sincroniza solo los permisos asignados directamente al usuario.
     * Los permisos heredados del rol no se modifican.
     * 
     * PUT /api/admin/usuarios/{userId}/permissions
     */
    public function updateUserPermissions(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Verificar permisos
            if (!$this->canManagePermissions($currentUser)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para gestionar permisos de usuarios',
                ], 403);
            }

            // Obtener usuario objetivo
            $targetUser = User::findOrFail($userId);

            // No permitir modificar permisos de super_admin
            if ($targetUser->hasRole('super_admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden modificar los permisos de un Super Administrador',
                ], 403);
            }

            // Si el usuario actual no es super_admin, no puede modificar permisos de administradores
            if (!$this->isSuperAdmin($currentUser) && $targetUser->hasRole('administrador')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para modificar los permisos de un Administrador',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'permissions' => 'present|array',
                'permissions.*' => 'string|exists:permissions,name',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $requestedPermissions = $request->permissions ?? [];

            // Obtener permisos heredados del rol (estos no deben ser asignados directamente)
            $inheritedPermissions = [];
            foreach ($targetUser->roles as $role) {
                $inheritedPermissions = array_merge(
                    $inheritedPermissions, 
                    $role->permissions->pluck('name')->toArray()
                );
            }
            $inheritedPermissions = array_unique($inheritedPermissions);

            // Filtrar: solo asignar directamente los permisos que NO están heredados
            $directPermissionsToAssign = array_diff($requestedPermissions, $inheritedPermissions);

            // Sincronizar permisos directos del usuario
            $targetUser->syncPermissions($directPermissionsToAssign);

            // Obtener estado actualizado
            $updatedDirectPermissions = $targetUser->getDirectPermissions()->pluck('name')->toArray();
            $effectivePermissions = $targetUser->getAllPermissions()->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Permisos del usuario actualizados correctamente',
                'data' => [
                    'user_id' => $targetUser->usuario_id,
                    'direct_permissions' => $updatedDirectPermissions,
                    'inherited_permissions' => $inheritedPermissions,
                    'effective_permissions' => $effectivePermissions,
                    'summary' => [
                        'inherited_count' => count($inheritedPermissions),
                        'direct_count' => count($updatedDirectPermissions),
                        'effective_count' => count($effectivePermissions),
                    ],
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar permisos del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revocar un permiso específico de un usuario.
     * 
     * Solo puede revocar permisos asignados directamente.
     * Los permisos heredados del rol no se pueden revocar aquí.
     * 
     * DELETE /api/admin/usuarios/{userId}/permissions/{permissionName}
     */
    public function revokeUserPermission(Request $request, $userId, $permissionName)
    {
        try {
            $currentUser = $request->user();

            if (!$this->canManagePermissions($currentUser)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tiene permisos para gestionar permisos de usuarios',
                ], 403);
            }

            $targetUser = User::findOrFail($userId);

            // Verificar que el permiso existe
            $permission = Permission::where('name', $permissionName)->first();
            if (!$permission) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permiso no encontrado',
                ], 404);
            }

            // Verificar si es un permiso directo
            $directPermissions = $targetUser->getDirectPermissions()->pluck('name')->toArray();
            if (!in_array($permissionName, $directPermissions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este permiso no está asignado directamente al usuario. ' .
                                 'Si es heredado del rol, debe cambiar el rol del usuario.',
                ], 400);
            }

            // Revocar el permiso
            $targetUser->revokePermissionTo($permissionName);

            return response()->json([
                'success' => true,
                'message' => 'Permiso revocado correctamente',
                'data' => [
                    'user_id' => $targetUser->usuario_id,
                    'revoked_permission' => $permissionName,
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al revocar permiso',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
