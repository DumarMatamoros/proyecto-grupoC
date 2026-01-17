import { useEffect, useState, useRef } from "react";
import {
  FaUser,
  FaEnvelope,
  FaCamera,
  FaLock,
  FaKey,
  FaSave,
  FaSpinner,
  FaShieldAlt,
  FaUserCircle,
  FaTrash,
} from "react-icons/fa";
import api from "../services/api";
import authService from "../services/authService";
import { getErrorMessage } from "../utils/errorTranslator";
import useToast from "../hooks/useToast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function UserProfileComponent() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Estado del formulario de perfil
  const [profile, setProfile] = useState({
    nombre: "",
    email: "",
    telefono: "",
    avatar: null,
  });

  // Estado del formulario de contraseña
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  // Preview de avatar
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Información del usuario (rol, fecha de registro, etc.)
  const [userInfo, setUserInfo] = useState(null);

  // Cargar perfil al montar
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await api.get("/profile");
      
      if (response.data?.success) {
        const data = response.data.data;
        setProfile({
          nombre: data.nombre || "",
          email: data.email || "",
          telefono: data.telefono || "",
          avatar: data.avatar_url || data.avatar || null,
        });
        setAvatarPreview(data.avatar_url || data.avatar || null);
        setUserInfo({
          tipo: data.tipo,
          created_at: data.created_at,
          cedula: data.cedula,
        });
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario de perfil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar selección de avatar
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("El archivo debe ser una imagen");
        return;
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen no debe exceder 2MB");
        return;
      }

      setAvatarFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar perfil
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!profile.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!profile.email.trim()) {
      toast.error("El correo electrónico es obligatorio");
      return;
    }

    try {
      setSavingProfile(true);

      // Usar FormData si hay archivo de avatar
      const formData = new FormData();
      formData.append("nombre", profile.nombre);
      formData.append("email", profile.email);
      if (profile.telefono) {
        formData.append("telefono", profile.telefono);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await api.post("/profile/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        toast.success("Perfil actualizado correctamente");
        
        const avatarUrl = response.data.data.avatar_url || response.data.data.avatar;
        
        // Actualizar datos en localStorage
        const user = authService.getUser();
        if (user) {
          user.nombre = response.data.data.nombre;
          user.email = response.data.data.email;
          user.avatar = avatarUrl;
          user.avatar_url = avatarUrl;
          localStorage.setItem("user", JSON.stringify(user));
          
          // Disparar evento para actualizar el Topbar
          window.dispatchEvent(new Event("userUpdated"));
        }

        // Actualizar estado local
        setProfile((prev) => ({
          ...prev,
          avatar: avatarUrl,
        }));
        setAvatarPreview(avatarUrl);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!passwords.current_password) {
      toast.error("La contraseña actual es obligatoria");
      return;
    }

    if (!passwords.password) {
      toast.error("La nueva contraseña es obligatoria");
      return;
    }

    if (passwords.password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwords.password !== passwords.password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setSavingPassword(true);

      const response = await api.post("/profile/password", passwords);

      if (response.data?.success) {
        toast.success("Contraseña actualizada correctamente");
        setPasswords({
          current_password: "",
          password: "",
          password_confirmation: "",
        });
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  // Eliminar avatar
  const handleDeleteAvatar = async () => {
    if (!profile.avatar && !avatarPreview) {
      toast.warning("No hay avatar para eliminar");
      return;
    }

    try {
      setUploadingAvatar(true);
      const response = await api.delete("/profile/avatar");

      if (response.data?.success) {
        toast.success("Avatar eliminado correctamente");
        setAvatarPreview(null);
        setAvatarFile(null);
        setProfile((prev) => ({ ...prev, avatar: null }));

        // Actualizar localStorage
        const user = authService.getUser();
        if (user) {
          user.avatar = null;
          localStorage.setItem("user", JSON.stringify(user));
          
          // Disparar evento para actualizar el Topbar
          window.dispatchEvent(new Event("userUpdated"));
        }
      }
    } catch (error) {
      console.error("Error eliminando avatar:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Obtener label del rol
  const getRoleLabel = (role) => {
    const roles = {
      administrador: "Administrador",
      empleado: "Empleado",
      cliente: "Cliente",
      proveedor: "Proveedor",
      bodeguero: "Bodeguero",
      contador: "Contador",
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <FaUserCircle className="text-blue-600" />
          Mi Perfil
        </h1>
        <p className="text-gray-600 mt-1">
          Administra tu información personal y seguridad de la cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TARJETA 1: Información Personal */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaUser />
              Información Personal
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-blue-200 shadow-md">
                    <span className="text-4xl font-bold text-white">
                      {profile.nombre?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                
                {/* Botón para subir foto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition"
                  title="Cambiar foto"
                >
                  <FaCamera className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />

              {/* Botón eliminar avatar */}
              {(avatarPreview || profile.avatar) && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={uploadingAvatar}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  {uploadingAvatar ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaTrash className="w-3 h-3" />
                  )}
                  Eliminar foto
                </button>
              )}

              {avatarFile && (
                <span className="mt-2 text-xs text-green-600">
                  Nueva imagen seleccionada
                </span>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Nombre completo
              </label>
              <input
                type="text"
                name="nombre"
                value={profile.nombre}
                onChange={handleProfileChange}
                autoComplete="name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                placeholder="Tu nombre completo"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaEnvelope className="text-blue-500" />
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                placeholder="tu@email.com"
              />
            </div>

            {/* Info adicional (solo lectura) */}
            {userInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rol:</span>
                  <span className="font-medium text-blue-600 capitalize">
                    {getRoleLabel(userInfo.tipo)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Miembro desde:</span>
                  <span className="font-medium text-gray-700">
                    {formatDate(userInfo.created_at)}
                  </span>
                </div>
                {userInfo.cedula && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cédula:</span>
                    <span className="font-medium text-gray-700">
                      {userInfo.cedula}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave />
                  Actualizar Información
                </>
              )}
            </button>
          </form>
        </div>

        {/* TARJETA 2: Seguridad */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaShieldAlt />
              Seguridad
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-5">
            <p className="text-sm text-gray-600 mb-4">
              Cambia tu contraseña para mantener tu cuenta segura. La nueva 
              contraseña debe tener al menos 6 caracteres.
            </p>

            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaLock className="text-green-500" />
                Contraseña actual
              </label>
              <input
                type="password"
                name="current_password"
                value={passwords.current_password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaKey className="text-green-500" />
                Nueva contraseña
              </label>
              <input
                type="password"
                name="password"
                value={passwords.password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                placeholder="Mínimo 6 caracteres"
              />
              {passwords.password && passwords.password.length < 6 && (
                <p className="text-xs text-amber-600 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FaKey className="text-green-500" />
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                name="password_confirmation"
                value={passwords.password_confirmation}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
                placeholder="Repite la nueva contraseña"
              />
              {passwords.password_confirmation &&
                passwords.password !== passwords.password_confirmation && (
                  <p className="text-xs text-red-600 mt-1">
                    Las contraseñas no coinciden
                  </p>
                )}
            </div>

            {/* Botón cambiar contraseña */}
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {savingPassword ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Cambiando...
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  Cambiar Contraseña
                </>
              )}
            </button>
          </form>

          {/* Consejos de seguridad */}
          <div className="px-6 pb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                💡 Consejos de seguridad
              </h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Usa una combinación de letras, números y símbolos</li>
                <li>• Evita usar información personal como fechas o nombres</li>
                <li>• No reutilices contraseñas de otros sitios</li>
                <li>• Cambia tu contraseña periódicamente</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
