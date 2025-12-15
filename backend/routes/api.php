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

// AUTENTICACIÓN
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// CONSULTAR IVA SIN AUTENTICAR
Route::get('/config/iva', [ConfiguracionController::class, 'obtenerIVA']);


/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (requieren Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
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

    // AUTH
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/perfil', [AuthController::class, 'updatePerfil']);

    /*
    |--------------------------------------------------------------------------
    | RUTAS SOLO PARA ADMINISTRADORES
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->middleware('check.admin')->group(function () {

        // Panel
        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // Usuarios
        Route::get('/usuarios', [AdminController::class, 'listUsuarios']);
        Route::get('/usuarios/{usuarioId}', [AdminController::class, 'showUsuario']);
        Route::put('/usuarios/{usuarioId}', [AdminController::class, 'updateUsuario']);
        Route::delete('/usuarios/{usuarioId}', [AdminController::class, 'deleteUsuario']);

        // Información del admin
        Route::get('/info', [AdminController::class, 'infoAdmin']);

        // Configuración
        Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
        Route::get('/configuraciones/{clave}', [ConfiguracionController::class, 'show']);
        Route::put('/configuraciones/{clave}', [ConfiguracionController::class, 'update']);
        Route::put('/configuraciones-iva', [ConfiguracionController::class, 'actualizarIVA']);
    });

    /*
    |--------------------------------------------------------------------------
    | FACTURACIÓN
    |--------------------------------------------------------------------------
    */
    Route::get('/facturas', [FacturaController::class, 'index']);
    Route::post('/facturas', [FacturaController::class, 'store']);
    Route::get('/facturas/{id}', [FacturaController::class, 'show']);
    Route::put('/facturas/{id}', [FacturaController::class, 'update']);
    Route::delete('/facturas/{id}', [FacturaController::class, 'destroy']);
});
