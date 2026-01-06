import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import authService from "../services/authService";
import useToast from "../hooks/useToast";

export default function CambiarClaveObligatoria() {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    password_actual: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones del lado cliente
    if (formData.password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Las contraseñas no coinciden");
      toast.error("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (formData.password === formData.password_actual) {
      setError("La nueva contraseña debe ser diferente a la actual");
      toast.error("La nueva contraseña debe ser diferente a la actual");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/cambiar-clave-obligatoria", formData);

      if (response.data.success) {
        // Actualizar usuario en localStorage
        const usuario = response.data.data.usuario;
        localStorage.setItem("user", JSON.stringify(usuario));

        toast.success("Contraseña actualizada exitosamente");
        // Redirigir al dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      const mensaje = err.response?.data?.message || "Error al cambiar la contraseña";
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        {/* Icono de advertencia */}
        <div className="flex justify-center mb-6">
          <div className="bg-orange-100 rounded-full p-4">
            <svg
              className="w-12 h-12 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Cambio de Contraseña Requerido
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Por seguridad, debe establecer una nueva contraseña antes de continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              name="password_actual"
              value={formData.password_actual}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="Ingrese su contraseña temporal"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="Repita la nueva contraseña"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 rounded-xl font-semibold shadow-md transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Cambiando...
              </>
            ) : (
              "Establecer Nueva Contraseña"
            )}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
        >
          Cerrar sesión
        </button>

        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} Sistema de Inventario y Facturación
        </p>
      </div>
    </div>
  );
}
