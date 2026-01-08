<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\CedulaEcuatoriana;
use App\Rules\TelefonoEcuatoriano;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario.
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:usuarios',
                'password' => 'required|string|min:6|confirmed',
                'tipo' => 'required|string|in:empleado,cliente,proveedor,administrador,bodeguero,contador',
                'cedula' => 'nullable|string|max:20',
                'telefono' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = User::create([
                'nombre' => $request->nombre,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'tipo' => $request->tipo,
            ]);

            $token = $usuario->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'usuario' => $usuario,
                    'token' => $token,
                    'token_type' => 'Bearer',
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en el registro',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Iniciar sesión.
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = User::where('email', $request->email)->first();

            if (!$usuario || !Hash::check($request->password, $usuario->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Las credenciales son incorrectas'
                ], 401);
            }

            $token = $usuario->createToken('auth_token')->plainTextToken;

            // Incluir flag de cambio de contraseña en la respuesta
            return response()->json([
                'success' => true,
                'message' => 'Sesión iniciada exitosamente',
                'data' => [
                    'usuario' => $usuario,
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'must_change_password' => (bool) $usuario->must_change_password,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al iniciar sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cerrar sesión.
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener usuario actual.
     */
    public function me(Request $request)
    {
        try {
            $usuario = $request->user();

            // Cargar la relación según el tipo
            if ($usuario->tipo === 'empleado' && $usuario->empleado) {
                $usuario->load('empleado.sucursal');
            } elseif ($usuario->tipo === 'cliente' && $usuario->cliente) {
                $usuario->load('cliente');
            } elseif ($usuario->tipo === 'proveedor' && $usuario->proveedor) {
                $usuario->load('proveedor');
            } elseif ($usuario->tipo === 'administrador' && $usuario->administrador) {
                $usuario->load('administrador');
            }

            return response()->json([
                'success' => true,
                'data' => $usuario
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil del usuario.
     */
    public function updatePerfil(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:usuarios,email,' . $request->user()->usuario_id . ',usuario_id',
                'password' => 'sometimes|string|min:6|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = $request->user();

            if ($request->has('nombre')) {
                $usuario->nombre = $request->nombre;
            }

            if ($request->has('email')) {
                $usuario->email = $request->email;
            }

            if ($request->has('password')) {
                $usuario->password = Hash::make($request->password);
            }

            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => $usuario
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar contraseña obligatoria (primer login).
     * 
     * Esta ruta se usa cuando must_change_password es true.
     * Requiere la contraseña actual y la nueva contraseña.
     */
    public function cambiarClaveObligatoria(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'password_actual' => 'required|string',
                'password' => 'required|string|min:8|confirmed|different:password_actual',
            ], [
                'password.min' => 'La nueva contraseña debe tener al menos 8 caracteres',
                'password.confirmed' => 'Las contraseñas no coinciden',
                'password.different' => 'La nueva contraseña debe ser diferente a la actual',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $usuario = $request->user();

            // Verificar contraseña actual
            if (!Hash::check($request->password_actual, $usuario->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta'
                ], 401);
            }

            // Actualizar contraseña y desactivar flag
            $usuario->password = Hash::make($request->password);
            $usuario->must_change_password = false;
            $usuario->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente. Ya puede acceder al sistema.',
                'data' => [
                    'usuario' => $usuario,
                    'must_change_password' => false,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
