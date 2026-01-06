import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ImagenFondo from "../image/PNG FONDO.png";
import useToast from "../hooks/useToast";

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { mustChangePassword } = await authService.login(email, password);
      
      // Si debe cambiar contraseña, redirigir a la página de cambio
      if (mustChangePassword) {
        toast.warning("Debe cambiar su contraseña antes de continuar");
        navigate("/cambiar-clave");
      } else {
        toast.success("Sesión iniciada correctamente");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("Credenciales incorrectas");
      setError("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

    <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

      {/* ---------------------- FORMULARIO ---------------------- */}
      <div className="p-12 flex flex-col justify-center">
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">
          Sistema de <br /> Inventario y Facturación
        </h1>

        <p className="text-gray-500 mb-10 text-sm">Iniciar Sesión</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">

          <div>
            <label className="text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
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
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <button
          className="w-full mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
          onClick={() => navigate("/recuperar-clave")}
        >
          ¿Olvidaste tu contraseña?
        </button>

        <p className="text-center text-gray-400 text-xs mt-10">
          © {new Date().getFullYear()} Sistema de Inventario y Facturación
        </p>
      </div>

      {/* ---------------------- IMAGEN ---------------------- */}
{/* ---------------------- PANEL DERECHO (IMAGEN COMO FONDO) ---------------------- */}
      <div
        className="flex items-center justify-center p-10 bg-center bg-no-repeat bg-[length:103%_160%]"
        style={{
          backgroundImage: `url(${ImagenFondo})`
        }}
      ></div>
    </div>
  </div>
);

}
