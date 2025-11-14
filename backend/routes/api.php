<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\FacturaController;
use App\Http\Controllers\Api\ConfiguracionController;

// Rutas públicas (sin autenticación)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Obtener IVA actual (sin autenticación)
Route::get('/config/iva', [ConfiguracionController::class, 'obtenerIVA']);

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Rutas de autenticación
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/perfil', [AuthController::class, 'updatePerfil']);

    // Rutas de administrador
    Route::prefix('admin')->middleware('check.admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/usuarios', [AdminController::class, 'listUsuarios']);
        Route::get('/usuarios/{usuarioId}', [AdminController::class, 'showUsuario']);
        Route::put('/usuarios/{usuarioId}', [AdminController::class, 'updateUsuario']);
        Route::delete('/usuarios/{usuarioId}', [AdminController::class, 'deleteUsuario']);
        Route::get('/info', [AdminController::class, 'infoAdmin']);

        // Rutas de configuración (solo admin)
        Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
        Route::get('/configuraciones/{clave}', [ConfiguracionController::class, 'show']);
        Route::put('/configuraciones/{clave}', [ConfiguracionController::class, 'update']);
        Route::put('/configuraciones-iva', [ConfiguracionController::class, 'actualizarIVA']);
    });

    // Rutas de facturación
    // Listar facturas
    Route::get('/facturas', [FacturaController::class, 'index']);
    // Crear factura (con consumidor final)
    Route::post('/facturas', [FacturaController::class, 'store']);
    // Ver detalle de factura
    Route::get('/facturas/{id}', [FacturaController::class, 'show']);
    // Actualizar factura
    Route::put('/facturas/{id}', [FacturaController::class, 'update']);
    // Eliminar factura
    Route::delete('/facturas/{id}', [FacturaController::class, 'destroy']);
});
