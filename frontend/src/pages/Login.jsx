import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ImagenFondo from "../image/PNG FONDO.png";
import useToast from "../hooks/useToast";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animación de entrada
  useEffect(() => {
    setMounted(true);
    // Recuperar email guardado si existe
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { mustChangePassword } = await authService.login(email, password);
      
      // Guardar email si "Recordarme" está activado
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      
      // Si debe cambiar contraseña, redirigir a la página de cambio
      if (mustChangePassword) {
        toast.warning("Debe cambiar su contraseña antes de continuar");
        navigate("/cambiar-clave");
      } else {
        toast.success("¡Bienvenido! Sesión iniciada correctamente");
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error("Credenciales incorrectas");
      setError("El correo o la contraseña son incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      
      {/* Efectos de fondo decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div 
        className={`bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 transform transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* ---------------------- FORMULARIO ---------------------- */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            Sistema de <br /> 
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Inventario y Facturación
            </span>
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Campo Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                required
                autoComplete="email"
              />
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* Recordarme y Olvidé contraseña */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer accent-orange-500"
                />
                <span className="text-gray-600">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-orange-500 hover:text-orange-600 font-medium hover:underline transition-colors"
                onClick={() => navigate("/recuperar-clave")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white py-4 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
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
                  Verificando...
                </>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">¿Eres nuevo?</span>
            </div>
          </div>

          {/* Botón Crear Cuenta */}
          <button
            type="button"
            onClick={() => navigate("/registro")}
            className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 py-3.5 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <FaUserPlus />
            Crear una Cuenta
          </button>

          {/* Información de seguridad */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-6">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Conexión segura
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Datos encriptados
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-4">
            © {new Date().getFullYear()} <span className="font-medium">TecnoMiguel</span>
          </p>
        </div>

        {/* ---------------------- PANEL DERECHO (IMAGEN) ---------------------- */}
        <div
          className="hidden lg:flex items-center justify-center p-10 bg-gradient-to-br from-cyan-100 via-blue-50 to-green-100 relative overflow-hidden"
        >
          {/* Imagen de fondo */}
          <div 
            className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-90"
            style={{
              backgroundImage: `url(${ImagenFondo})`,
              backgroundSize: '85%',
              backgroundPosition: 'center'
            }}
          ></div>
          
          {/* Overlay con información */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-8">
            <h3 className="text-white text-xl font-bold mb-2">TecnoMiguel</h3>
            <p className="text-white/80 text-sm">
              Innovación y Tecnología a tu Alcance
            </p>
          </div>

          {/* Decoración flotante */}
          <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium text-gray-700">v2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
