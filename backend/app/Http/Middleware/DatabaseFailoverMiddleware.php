<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\DatabaseFailoverService;
use Illuminate\Support\Facades\DB;

class DatabaseFailoverMiddleware
{
    /**
     * Maneja la solicitud con fallback automático a BD réplica
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Verificar si la BD primaria está disponible
            if (!DatabaseFailoverService::isPrimaryAvailable()) {
                // Si no está disponible, cambiar a réplica
                if (DatabaseFailoverService::isReplicaAvailable()) {
                    // Usar la réplica como conexión por defecto
                    config(['database.default' => 'pgsql-replica']);
                    \Log::warning('Usando base de datos réplica - BD primaria no disponible');
                } else {
                    throw new \Exception('Ni la BD primaria ni la réplica están disponibles');
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error en verificación de BD: ' . $e->getMessage());
        }

        return $next($request);
    }
}
