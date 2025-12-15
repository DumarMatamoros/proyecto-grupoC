<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Roles permitidos se pasan como parámetros: check.role:administrador,empleado
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado',
            ], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        if (!in_array($user->tipo, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a este recurso',
            ], 403);
        }

        return $next($request);
    }
}
