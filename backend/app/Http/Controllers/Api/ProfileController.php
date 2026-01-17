<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Obtener información del perfil del usuario autenticado.
     */
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            
            return response()->json([
                'success' => true,
                'message' => 'Perfil obtenido exitosamente',
                'data' => [
                    'id' => $user->usuario_id,
                    'nombre' => $user->nombre,
                    'email' => $user->email,
                    'tipo' => $user->tipo,
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar_url,
                    'cedula' => $user->cedula,
                    'telefono' => $user->telefono,
                    'created_at' => $user->created_at,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar información del perfil (nombre, email, avatar).
     */
    public function update(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'nombre' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:usuarios,email,' . $user->usuario_id . ',usuario_id',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'telefono' => 'nullable|string|max:20',
            ], [
                'nombre.required' => 'El nombre es obligatorio',
                'nombre.max' => 'El nombre no puede exceder 255 caracteres',
                'email.required' => 'El correo electrónico es obligatorio',
                'email.email' => 'El correo electrónico debe ser válido',
                'email.unique' => 'Este correo electrónico ya está en uso',
                'avatar.image' => 'El archivo debe ser una imagen',
                'avatar.mimes' => 'La imagen debe ser de tipo: jpeg, png, jpg, gif, webp',
                'avatar.max' => 'La imagen no debe exceder 2MB',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar campos básicos
            if ($request->has('nombre')) {
                $user->nombre = $request->nombre;
            }

            if ($request->has('email')) {
                $user->email = $request->email;
            }

            if ($request->has('telefono')) {
                $user->telefono = $request->telefono;
            }

            // Manejar subida de avatar
            if ($request->hasFile('avatar')) {
                // Eliminar avatar anterior si existe
                if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                    Storage::disk('public')->delete($user->avatar);
                }

                // Guardar nuevo avatar
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $avatarPath;
            }

            $user->save();
            
            // Refrescar el modelo para obtener el accessor actualizado
            $user->refresh();

            // Actualizar datos en localStorage del frontend
            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => [
                    'id' => $user->usuario_id,
                    'nombre' => $user->nombre,
                    'email' => $user->email,
                    'tipo' => $user->tipo,
                    'avatar' => $user->avatar,
                    'avatar_url' => $user->avatar_url,
                    'cedula' => $user->cedula,
                    'telefono' => $user->telefono,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar la contraseña del usuario.
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'password' => 'required|string|min:6|confirmed',
            ], [
                'current_password.required' => 'La contraseña actual es obligatoria',
                'password.required' => 'La nueva contraseña es obligatoria',
                'password.min' => 'La nueva contraseña debe tener al menos 6 caracteres',
                'password.confirmed' => 'La confirmación de la contraseña no coincide',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Errores de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verificar que la contraseña actual sea correcta
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual es incorrecta',
                    'errors' => [
                        'current_password' => ['La contraseña actual es incorrecta']
                    ]
                ], 422);
            }

            // Verificar que la nueva contraseña sea diferente a la actual
            if (Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La nueva contraseña debe ser diferente a la actual',
                    'errors' => [
                        'password' => ['La nueva contraseña debe ser diferente a la actual']
                    ]
                ], 422);
            }

            // Actualizar la contraseña
            $user->password = Hash::make($request->password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar la contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar el avatar del usuario.
     */
    public function deleteAvatar(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
                $user->avatar = null;
                $user->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Avatar eliminado exitosamente',
                'data' => [
                    'avatar' => null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el avatar',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
