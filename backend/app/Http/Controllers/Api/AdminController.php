<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Administrador;
use App\Models\Empleado;
use App\Models\Cliente;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Obtener dashboard con estadísticas generales.
     */
    public function dashboard(Request $request)
    {
        try {
            $usuario = $request->user();

            // Verificar que sea administrador
            if ($usuario->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para acceder al panel de administrador'
                ], 403);
            }

            $estadisticas = [
                'total_usuarios' => User::count(),
                'total_empleados' => Empleado::count(),
                'total_clientes' => Cliente::count(),
                'total_proveedores' => Proveedor::count(),
                'total_administradores' => Administrador::count(),
                'usuarios_por_tipo' => [
                    'empleados' => User::where('tipo', 'empleado')->count(),
                    'clientes' => User::where('tipo', 'cliente')->count(),
                    'proveedores' => User::where('tipo', 'proveedor')->count(),
                    'administradores' => User::where('tipo', 'administrador')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $estadisticas
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todos los usuarios.
     */
    public function listUsuarios(Request $request)
    {
        try {
            $usuario = $request->user();

            // Verificar que sea administrador
            if ($usuario->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para acceder al panel de administrador'
                ], 403);
            }

            $tipo = $request->query('tipo');
            $pagina = $request->query('page', 1);
            $perPagina = $request->query('per_page', 15);

            $query = User::query();

            if ($tipo) {
                $query->where('tipo', $tipo);
            }

            $usuarios = $query->paginate($perPagina, ['*'], 'page', $pagina);

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalles de un usuario específico.
     */
    public function showUsuario(Request $request, $usuarioId)
    {
        try {
            $usuario = $request->user();

            // Verificar que sea administrador
            if ($usuario->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para acceder al panel de administrador'
                ], 403);
            }

            $usuarioDetalle = User::findOrFail($usuarioId);

            // Cargar la relación según el tipo
            if ($usuarioDetalle->tipo === 'empleado') {
                $usuarioDetalle->load('empleado.sucursal');
            } elseif ($usuarioDetalle->tipo === 'cliente') {
                $usuarioDetalle->load('cliente');
            } elseif ($usuarioDetalle->tipo === 'proveedor') {
                $usuarioDetalle->load('proveedor');
            } elseif ($usuarioDetalle->tipo === 'administrador') {
                $usuarioDetalle->load('administrador');
            }

            return response()->json([
                'success' => true,
                'data' => $usuarioDetalle
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Actualizar un usuario (por administrador).
     */
    public function updateUsuario(Request $request, $usuarioId)
    {
        try {
            $admin = $request->user();

            // Verificar que sea administrador
            if ($admin->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $usuario = User::findOrFail($usuarioId);

            if ($request->has('nombre')) {
                $usuario->nombre = $request->nombre;
            }

            if ($request->has('email')) {
                $usuario->email = $request->email;
            }

            if ($request->has('tipo')) {
                $usuario->tipo = $request->tipo;
            }

            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => $usuario
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un usuario.
     */
    public function deleteUsuario(Request $request, $usuarioId)
    {
        try {
            $admin = $request->user();

            // Verificar que sea administrador
            if ($admin->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            // No permitir eliminar al mismo administrador
            if ($usuarioId == $admin->usuario_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No puedes eliminar tu propia cuenta'
                ], 400);
            }

            $usuario = User::findOrFail($usuarioId);
            $usuario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información del administrador actual.
     */
    public function infoAdmin(Request $request)
    {
        try {
            $usuario = $request->user();

            if ($usuario->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No eres administrador'
                ], 403);
            }

            $admin = $usuario->load('administrador');

            return response()->json([
                'success' => true,
                'data' => $admin
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información de administrador',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo usuario (solo administrador).
     * 
     * El usuario se crea con must_change_password = true para forzar
     * el cambio de contraseña en el primer login.
     */
    public function createUsuario(Request $request)
    {
        try {
            $admin = $request->user();

            // Verificar que sea administrador
            if ($admin->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:usuarios,email',
                'tipo' => 'required|string|in:empleado,cliente,proveedor,administrador',
                'password' => 'nullable|string|min:8',
            ], [
                'nombre.required' => 'El nombre es obligatorio',
                'email.required' => 'El email es obligatorio',
                'email.unique' => 'Este email ya está registrado',
                'tipo.required' => 'El tipo de usuario es obligatorio',
                'tipo.in' => 'El tipo de usuario no es válido',
                'password.min' => 'La contraseña debe tener al menos 8 caracteres',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Generar contraseña temporal si no se proporciona
            $passwordTemporal = $request->password ?? Str::random(12);

            // Crear el usuario
            $nuevoUsuario = User::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'password' => Hash::make($passwordTemporal),
                'tipo' => $request->tipo,
                'must_change_password' => true, // Forzar cambio en primer login
            ]);

            // Si es administrador, crear registro en tabla administradores
            if ($request->tipo === 'administrador') {
                Administrador::create([
                    'usuario_id' => $nuevoUsuario->usuario_id,
                    'nivel' => 'moderador',
                    'permisos' => json_encode(['usuarios' => true, 'reportes' => true]),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'usuario' => $nuevoUsuario,
                    'password_temporal' => $passwordTemporal, // Solo se muestra una vez
                    'instrucciones' => 'El usuario deberá cambiar su contraseña en el primer login.',
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resetear contraseña de un usuario (solo administrador).
     * 
     * Opciones:
     * - mode: 'manual' → El admin establece la nueva contraseña
     * - mode: 'force_change' → Solo activa must_change_password (el usuario cambiará en próximo login)
     * - mode: 'generate' (default) → Genera contraseña temporal y activa must_change_password
     */
    public function resetPassword(Request $request, $usuarioId)
    {
        try {
            $admin = $request->user();

            // Verificar que sea administrador
            if ($admin->tipo !== 'administrador') {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para realizar esta acción'
                ], 403);
            }

            $usuario = User::findOrFail($usuarioId);

            $mode = $request->input('mode', 'generate');

            switch ($mode) {
                case 'manual':
                    // El admin establece la contraseña manualmente
                    $validator = Validator::make($request->all(), [
                        'new_password' => 'required|string|min:8|max:100',
                        'force_change' => 'boolean',
                    ], [
                        'new_password.required' => 'La nueva contraseña es requerida',
                        'new_password.min' => 'La contraseña debe tener al menos 8 caracteres',
                    ]);

                    if ($validator->fails()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Datos inválidos',
                            'errors' => $validator->errors(),
                        ], 422);
                    }

                    $usuario->password = Hash::make($request->new_password);
                    $usuario->must_change_password = $request->input('force_change', false);
                    $usuario->save();

                    // Revocar tokens si se fuerza el cambio
                    if ($request->input('force_change', false)) {
                        $usuario->tokens()->delete();
                    }

                    return response()->json([
                        'success' => true,
                        'message' => 'Contraseña actualizada exitosamente',
                        'data' => [
                            'usuario_id' => $usuario->usuario_id,
                            'email' => $usuario->email,
                            'must_change_password' => $usuario->must_change_password,
                        ]
                    ], 200);

                case 'force_change':
                    // Solo activar el flag para que cambie en próximo login
                    $usuario->must_change_password = true;
                    $usuario->save();

                    // Revocar todos los tokens existentes del usuario
                    $usuario->tokens()->delete();

                    return response()->json([
                        'success' => true,
                        'message' => 'El usuario deberá cambiar su contraseña en el próximo inicio de sesión',
                        'data' => [
                            'usuario_id' => $usuario->usuario_id,
                            'email' => $usuario->email,
                            'must_change_password' => true,
                        ]
                    ], 200);

                case 'generate':
                default:
                    // Generar nueva contraseña temporal
                    $passwordTemporal = Str::random(12);

                    $usuario->password = Hash::make($passwordTemporal);
                    $usuario->must_change_password = true;
                    $usuario->save();

                    // Revocar todos los tokens existentes del usuario
                    $usuario->tokens()->delete();

                    return response()->json([
                        'success' => true,
                        'message' => 'Contraseña reseteada exitosamente',
                        'data' => [
                            'usuario_id' => $usuario->usuario_id,
                            'email' => $usuario->email,
                            'password_temporal' => $passwordTemporal,
                            'instrucciones' => 'El usuario deberá cambiar su contraseña en el próximo login.',
                        ]
                    ], 200);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al resetear contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
