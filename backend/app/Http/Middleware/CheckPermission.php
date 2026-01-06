<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Middleware para verificar permisos granulares.
     * 
     * Uso: ->middleware('permission:inventario.ver')
     *      ->middleware('permission:inventario.crear,inventario.editar') // OR
     * 
     * El Super Admin siempre tiene acceso.
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado',
            ], 401);
        }

        // Super Admin siempre tiene acceso
        if ($this->isSuperAdmin($user)) {
            return $next($request);
        }

        // Verificar si tiene alguno de los permisos requeridos (OR)
        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return $next($request);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'No tiene permisos para realizar esta acción',
            'required_permissions' => $permissions,
        ], 403);
    }

    /**
     * Verificar si es super admin.
     */
    private function isSuperAdmin($user): bool
    {
        return $user->hasRole('super_admin') || 
               ($user->tipo === 'administrador' && $user->administrador?->nivel === 'super');
    }
}
