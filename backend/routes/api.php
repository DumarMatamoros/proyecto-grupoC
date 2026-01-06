<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Controladores
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\FacturaController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\CompraController;
use App\Http\Controllers\EgresoController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\ProveedorController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS
|--------------------------------------------------------------------------
*/

// Health check (estado de app y conexión a BD)
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json([
            'status' => 'ok',
            'database' => 'connected',
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'database' => 'disconnected',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// CATEGORÍAS (mover a rutas protegidas)
// PRODUCTOS (mover a rutas protegidas)

// AUTENTICACIÓN (sin registro público - usuarios creados solo por admin)
Route::post('/auth/login', [AuthController::class, 'login']);

// CONSULTAR IVA SIN AUTENTICAR
Route::get('/config/iva', [ConfiguracionController::class, 'obtenerIVA']);


/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (requieren Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | RUTAS SIN VERIFICACIÓN DE CONTRASEÑA (para cambio obligatorio)
    |--------------------------------------------------------------------------
    */
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/cambiar-clave-obligatoria', [AuthController::class, 'cambiarClaveObligatoria']);

    /*
    |--------------------------------------------------------------------------
    | RUTAS CON VERIFICACIÓN DE CONTRASEÑA (bloqueadas si must_change_password)
    |--------------------------------------------------------------------------
    */
    Route::middleware('check.password')->group(function () {
        // CATEGORÍAS
        Route::get('/categorias', [CategoriaController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/categorias', [CategoriaController::class, 'store'])
            ->middleware('check.role:administrador');
        Route::put('/categorias/{id}', [CategoriaController::class, 'update'])
            ->middleware('check.role:administrador');
        Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy'])
            ->middleware('check.role:administrador');

        // PRODUCTOS
        Route::get('/productos', [ProductoController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/productos', [ProductoController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::put('/productos/{id}', [ProductoController::class, 'update'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/productos/{id}', [ProductoController::class, 'destroy'])
            ->middleware('check.role:administrador');
        Route::post('/productos/import/preview', [ProductoController::class, 'importPreview'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/productos/import/confirm', [ProductoController::class, 'importConfirm'])
            ->middleware('check.role:administrador,empleado');

        // COMPRAS / INGRESOS DE STOCK
        Route::get('/compras', [CompraController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/compras/estadisticas', [CompraController::class, 'estadisticas'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/compras/proveedores', [CompraController::class, 'proveedores'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/compras/{id}', [CompraController::class, 'show'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/compras', [CompraController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::put('/compras/{id}', [CompraController::class, 'update'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/compras/{id}', [CompraController::class, 'destroy'])
            ->middleware('check.role:administrador');

        // EGRESOS / DESECHO DE PRODUCTOS
        Route::get('/egresos', [EgresoController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/egresos/estadisticas', [EgresoController::class, 'estadisticas'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/egresos/productos-problematicos', [EgresoController::class, 'productosProblematicos'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/egresos/{id}', [EgresoController::class, 'show'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/egresos', [EgresoController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/egresos/{id}', [EgresoController::class, 'destroy'])
            ->middleware('check.role:administrador');

        /*
        |--------------------------------------------------------------------------
        | CLIENTES (Entidades para facturación - Sin login)
        |--------------------------------------------------------------------------
        */
        Route::get('/clientes', [ClienteController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/clientes/search', [ClienteController::class, 'search'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/clientes/id-types', [ClienteController::class, 'getIdTypes'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/clientes/consumidor-final', [ClienteController::class, 'getConsumidorFinal'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/clientes/{id}', [ClienteController::class, 'show'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/clientes', [ClienteController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::put('/clientes/{id}', [ClienteController::class, 'update'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/clientes/{id}', [ClienteController::class, 'destroy'])
            ->middleware('check.role:administrador');

        /*
        |--------------------------------------------------------------------------
        | PROVEEDORES (Entidades externas - Sin login)
        |--------------------------------------------------------------------------
        */
        Route::get('/proveedores', [ProveedorController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/proveedores/search', [ProveedorController::class, 'search'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/proveedores/id-types', [ProveedorController::class, 'getIdTypes'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/proveedores/tipos', [ProveedorController::class, 'getTiposProveedor'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/proveedores/estadisticas', [ProveedorController::class, 'estadisticas'])
            ->middleware('check.role:administrador');
        Route::get('/proveedores/{id}', [ProveedorController::class, 'show'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/proveedores', [ProveedorController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::put('/proveedores/{id}', [ProveedorController::class, 'update'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/proveedores/{id}', [ProveedorController::class, 'destroy'])
            ->middleware('check.role:administrador');

        // AUTH - Actualización de perfil
        Route::put('/auth/perfil', [AuthController::class, 'updatePerfil']);

        /*
        |--------------------------------------------------------------------------
        | RUTAS SOLO PARA ADMINISTRADORES
        |--------------------------------------------------------------------------
        */
        Route::prefix('admin')->middleware('check.admin')->group(function () {

            // Panel
            Route::get('/dashboard', [AdminController::class, 'dashboard']);

            // Usuarios CRUD (solo admin puede crear usuarios)
            Route::get('/usuarios', [AdminController::class, 'listUsuarios']);
            Route::post('/usuarios', [AdminController::class, 'createUsuario']);
            Route::get('/usuarios/{usuarioId}', [AdminController::class, 'showUsuario']);
            Route::put('/usuarios/{usuarioId}', [AdminController::class, 'updateUsuario']);
            Route::delete('/usuarios/{usuarioId}', [AdminController::class, 'deleteUsuario']);
            Route::post('/usuarios/{usuarioId}/reset-password', [AdminController::class, 'resetPassword']);

            // Información del admin
            Route::get('/info', [AdminController::class, 'infoAdmin']);

            // Configuración
            Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
            Route::get('/configuraciones/{clave}', [ConfiguracionController::class, 'show']);
            Route::put('/configuraciones/{clave}', [ConfiguracionController::class, 'update']);
            Route::put('/configuraciones-iva', [ConfiguracionController::class, 'actualizarIVA']);

            // Roles y Permisos (ACL)
            Route::get('/roles', [PermissionController::class, 'index']);
            Route::get('/roles/matrix', [PermissionController::class, 'getMatrix']);
            Route::post('/roles', [PermissionController::class, 'createRole']);
            Route::put('/roles/{roleId}/permissions', [PermissionController::class, 'updateRolePermissions']);
            Route::delete('/roles/{roleId}', [PermissionController::class, 'deleteRole']);
            Route::post('/usuarios/{usuarioId}/role', [PermissionController::class, 'assignRoleToUser']);

            // Permisos por Usuario (Estrategia Híbrida)
            Route::get('/usuarios/{usuarioId}/permissions-matrix', [PermissionController::class, 'getUserPermissionsMatrix']);
            Route::put('/usuarios/{usuarioId}/permissions', [PermissionController::class, 'updateUserPermissions']);
            Route::delete('/usuarios/{usuarioId}/permissions/{permissionName}', [PermissionController::class, 'revokeUserPermission'])
                ->where('permissionName', '[a-z_\.]+'); // Permitir puntos en el nombre del permiso
        });

        /*
        |--------------------------------------------------------------------------
        | FACTURACIÓN
        |--------------------------------------------------------------------------
        */
        Route::get('/facturas', [FacturaController::class, 'index'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/facturas/estadisticas', [FacturaController::class, 'estadisticas'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/facturas/clientes', [FacturaController::class, 'buscarClientes'])
            ->middleware('check.role:administrador,empleado');
        Route::get('/facturas/{id}', [FacturaController::class, 'show'])
            ->middleware('check.role:administrador,empleado');
        Route::post('/facturas', [FacturaController::class, 'store'])
            ->middleware('check.role:administrador,empleado');
        Route::put('/facturas/{id}', [FacturaController::class, 'update'])
            ->middleware('check.role:administrador,empleado');
        Route::delete('/facturas/{id}', [FacturaController::class, 'destroy'])
            ->middleware('check.role:administrador');
    });
});
