<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\ConnectionInterface;
use Exception;

/**
 * Servicio para manejar fallback automático entre la BD primaria y réplica
 * Si la BD primaria no está disponible, automáticamente cambia a la réplica
 */
class DatabaseFailoverService
{
    protected const MAX_RETRIES = 3;
    protected const RETRY_DELAY_MS = 500;

    /**
     * Obtiene la conexión a la base de datos con fallback automático
     *
     * @return ConnectionInterface
     * @throws Exception
     */
    public static function getConnection(): ConnectionInterface
    {
        try {
            // Intentar usar la BD primaria
            if (self::isPrimaryAvailable()) {
                return DB::connection('pgsql');
            }
        } catch (Exception $e) {
            \Log::warning('BD primaria no disponible, usando réplica', ['error' => $e->getMessage()]);
        }

        // Fallback a la BD réplica si la primaria no está disponible
        return DB::connection('pgsql-replica');
    }

    /**
     * Verifica si la BD primaria está disponible
     *
     * @return bool
     */
    public static function isPrimaryAvailable(): bool
    {
        $retries = 0;

        while ($retries < self::MAX_RETRIES) {
            try {
                DB::connection('pgsql')->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
                return true;
            } catch (Exception $e) {
                $retries++;
                if ($retries < self::MAX_RETRIES) {
                    usleep(self::RETRY_DELAY_MS * 1000);
                }
            }
        }

        return false;
    }

    /**
     * Verifica si la BD réplica está disponible
     *
     * @return bool
     */
    public static function isReplicaAvailable(): bool
    {
        try {
            DB::connection('pgsql-replica')->getPdo()->getAttribute(\PDO::ATTR_SERVER_VERSION);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Obtiene el estado de ambas bases de datos
     *
     * @return array
     */
    public static function getStatus(): array
    {
        return [
            'primary' => [
                'available' => self::isPrimaryAvailable(),
                'connection' => config('database.connections.pgsql'),
            ],
            'replica' => [
                'available' => self::isReplicaAvailable(),
                'connection' => config('database.connections.pgsql-replica'),
            ],
        ];
    }
}
