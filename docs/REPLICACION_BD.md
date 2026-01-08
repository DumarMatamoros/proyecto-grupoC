The server must be started under an unprivileged user ID to prevent

possible system security compromise.  See the documentation for

more information on how to properly start the server.# Sistema de Replicación de Base de Datos - Guía de Implementación

## Descripción General

Se ha implementado un sistema de replicación de PostgreSQL en tiempo real que proporciona:
- **Base de datos primaria (db)**: Acepta lecturas y escrituras
- **Base de datos réplica (db-replica)**: Sincronizada automáticamente, acepta solo lecturas
- **Fallback automático**: Si la BD primaria falla, la aplicación cambia automáticamente a la réplica

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Aplicación Laravel                     │
│              (DatabaseFailoverMiddleware)                │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌────────────┐            ┌──────────────┐
    │   DB       │            │  DB-Replica  │
    │ (Primaria) │◄───────────┤  (Standby)   │
    │ Puerto 5432│ Streaming  │  Puerto 5433 │
    └────────────┘ Replication└──────────────┘
```

## Componentes Implementados

### 1. Docker Compose (`docker-compose.yml`)

**Nueva base de datos réplica:**
- **Imagen**: postgres:15
- **Puerto**: 5433
- **Variables de replicación**: Configuradas para streaming replication
- **Volúmenes**: Datos persistentes en `db_replica_data`

**Cambios en BD primaria:**
- **Variables de replicación**: wal_level=replica, max_wal_senders=3
- **Volúmenes**: Datos persistentes en `db_data`

### 2. Scripts de Inicialización

**`backend/scripts/init-db-primary.sql`**
- Crea usuario `replicator` con permisos de replicación
- Configura el slot de replicación física

**`backend/scripts/init-db-replica.sh`**
- Realiza `pg_basebackup` desde la BD primaria
- Configura la réplica en modo standby
- Establece recuperación continua desde la BD primaria

### 3. Configuración de Laravel

**`config/database.php`**
- Conexión primaria: `pgsql`
- Conexión réplica: `pgsql-replica` (read_only=true)

**`.env`**
- `DB_REPLICA_HOST=db-replica`
- `DB_REPLICA_PORT=5432`

### 4. Servicios Personalizados

**`app/Services/DatabaseFailoverService.php`**
- `getConnection()`: Obtiene la conexión con fallback automático
- `isPrimaryAvailable()`: Verifica disponibilidad de BD primaria
- `isReplicaAvailable()`: Verifica disponibilidad de BD réplica
- `getStatus()`: Retorna estado de ambas conexiones

**Uso:**
```php
use App\Services\DatabaseFailoverService;

// Obtener conexión con fallback automático
$connection = DatabaseFailoverService::getConnection();

// Verificar estado
$status = DatabaseFailoverService::getStatus();
```

### 5. Middleware de Fallback

**`app/Http/Middleware/DatabaseFailoverMiddleware.php`**
- Se ejecuta en cada solicitud HTTP
- Verifica disponibilidad de BD primaria
- Cambia automáticamente a réplica si es necesario
- Registra eventos en logs

## Instalación y Configuración

### Paso 1: Iniciar los contenedores

```bash
cd proyecto-grupoC
docker-compose up -d
```

### Paso 2: Esperar inicialización de replicación

La replicación toma 10-30 segundos en inicializarse. Verificar estado:

```bash
# Ver logs de la réplica
docker-compose logs db-replica

# Conectarse a la BD primaria para verificar
docker exec -it proyecto-grupoC-db-1 psql -U postgres -c "SELECT * FROM pg_stat_replication;"
```

### Paso 3: Registrar el middleware (Opcional)

Si deseas que el fallback sea automático en todas las solicitudes, registra el middleware en `app/Http/Kernel.php`:

```php
protected $middleware = [
    // ...
    \App\Http\Middleware\DatabaseFailoverMiddleware::class,
];
```

O en un route group específico:

```php
Route::middleware('database-failover')->group(function () {
    // Tus rutas aquí
});
```

## Uso en la Aplicación

### Opción 1: Usando el Servicio Directamente

```php
use App\Services\DatabaseFailoverService;

// En un controlador
public function getData()
{
    $connection = DatabaseFailoverService::getConnection();
    $data = $connection->table('usuarios')->get();
    
    return response()->json($data);
}
```

### Opción 2: Usando el Middleware (Automático)

Con el middleware registrado, el sistema detecta automáticamente si la BD primaria está disponible y cambia a la réplica si es necesario.

### Opción 3: Especificar conexión manualmente

```php
// Usar BD primaria explícitamente
DB::connection('pgsql')->table('usuarios')->get();

// Usar BD réplica explícitamente
DB::connection('pgsql-replica')->table('usuarios')->get();
```

## Verificación del Sistema

### Comando Artisan para verificar estado

Crea un comando Artisan para facilitar el monitoreo:

```bash
php artisan make:command CheckDatabaseStatus
```

```php
// app/Console/Commands/CheckDatabaseStatus.php
public function handle()
{
    $status = DatabaseFailoverService::getStatus();
    
    $this->info('Estado de las bases de datos:');
    $this->table(['BD', 'Disponible'], [
        ['Primaria', $status['primary']['available'] ? '✓ Sí' : '✗ No'],
        ['Réplica', $status['replica']['available'] ? '✓ Sí' : '✗ No'],
    ]);
}
```

### Monitoreo vía endpoint API

```php
Route::get('/api/database-status', function () {
    return DatabaseFailoverService::getStatus();
});
```

## Comportamiento en Caso de Fallo

### Escenario 1: BD Primaria se cae

1. El middleware detecta que la primaria no responde
2. Automáticamente cambia a la réplica
3. Las operaciones de lectura continúan funcionando
4. Las operaciones de escritura se rechazarán (read_only=true)
5. Se registra un warning en logs

### Escenario 2: Recuperación de la BD Primaria

Una vez que la BD primaria se recupera:
1. El middleware detecta que está disponible nuevamente
2. Las siguientes solicitudes se dirigirán a la primaria
3. La replicación se sincroniza automáticamente

### Escenario 3: Ambas BDs no disponibles

La aplicación lanzará una excepción. Implementa manejo de errores:

```php
try {
    $connection = DatabaseFailoverService::getConnection();
    $data = $connection->table('usuarios')->get();
} catch (Exception $e) {
    \Log::error('Ambas bases de datos no están disponibles', ['error' => $e]);
    return response()->json(['error' => 'Servicio temporalmente no disponible'], 503);
}
```

## Pruebas

### Prueba 1: Simular fallo de BD primaria

```bash
# Detener la BD primaria
docker-compose stop db

# Verificar que se usa la réplica
curl http://localhost:8000/api/database-status

# Reiniciar la BD primaria
docker-compose start db

# La aplicación debe volver a usar la primaria automáticamente
```

### Prueba 2: Verificar replicación

```bash
# En la BD primaria
docker exec -it proyecto-grupoC-db-1 psql -U postgres -d DBgrupoC

# Insertar datos de prueba
INSERT INTO usuarios (nombre, email) VALUES ('Test', 'test@example.com');

# En la BD réplica (desde otra terminal)
docker exec -it proyecto-grupoC-db-replica-1 psql -U postgres -d DBgrupoC

# Verificar que el dato está replicado
SELECT * FROM usuarios WHERE email = 'test@example.com';
```

## Logs Importantes

Monitorea estos logs para detectar problemas:

```bash
# Logs de Docker
docker-compose logs -f

# Logs de replicación
docker exec -it proyecto-grupoC-db-1 psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# Logs de la aplicación
tail -f storage/logs/laravel.log | grep -i "base\|replica"
```

## Limitaciones y Consideraciones

⚠️ **Importante:**
- La réplica solo acepta **lecturas** (read_only=true)
- Las escrituras deben dirigirse siempre a la BD primaria
- Si ambas BDs caen, la aplicación tendrá un downtime
- La replicación es asincrónica (hay un lag muy pequeño)

## Próximas Mejoras Recomendadas

1. **Implementar multi-master replication** para escrituras en ambas BDs
2. **Agregar un HAProxy** para balanceo de carga
3. **Implementar monitoreo con Prometheus/Grafana**
4. **Crear alertas cuando ambas BDs no estén disponibles**
5. **Implementar backups automáticos** de ambas BDs

## Solución de Problemas

### Error: "Primary connection not available"

**Causa**: BD primaria no responde
**Solución**: Verificar logs y reiniciar BD primaria

```bash
docker-compose logs db
docker-compose restart db
```

### Error: "Streaming replication failed"

**Causa**: Problemas con slots de replicación
**Solución**: Recrear los containers

```bash
docker-compose down -v
docker-compose up -d
```

### La réplica no se sincroniza

**Causa**: Falta de conectividad entre contenedores
**Solución**: Verificar que ambos contenedores estén en la misma red

```bash
docker network ls
docker inspect proyecto-grupoC_default
```

## Contacto y Soporte

Para problemas o preguntas sobre la replicación:
- Revisar logs: `docker-compose logs`
- Conectar a PostgreSQL directamente para debugging
- Consultar documentación de PostgreSQL Replication
