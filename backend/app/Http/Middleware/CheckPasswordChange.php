<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPasswordChange
{
    /**
     * Verifica si el usuario debe cambiar su contraseña.
     * 
     * Si must_change_password es true, bloquea el acceso a todas las rutas
     * excepto las de cambio de contraseña y logout.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado',
            ], 401);
        }

        // Si el usuario debe cambiar contraseña, bloquear acceso
        if ($user->must_change_password) {
            return response()->json([
                'success' => false,
                'message' => 'Debe cambiar su contraseña antes de continuar',
                'must_change_password' => true,
                'redirect' => '/cambiar-clave',
            ], 403);
        }

        return $next($request);
    }
}
