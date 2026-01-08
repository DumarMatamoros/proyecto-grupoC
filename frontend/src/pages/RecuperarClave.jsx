import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import useToast from "../hooks/useToast";
import { FaEnvelope, FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import ImagenFondo from "../image/PNG FONDO.png";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success("Se ha enviado un correo con las instrucciones");
    } catch {
      toast.error("Error al enviar el correo. Verifica que el email esté registrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      
      {/* Efectos de fondo decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div 
        className={`bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 transform transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* ---------------------- FORMULARIO ---------------------- */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Botón volver */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors mb-6 w-fit"
          >
            <FaArrowLeft />
            <span className="text-sm">Volver al inicio</span>
          </button>

          {!sent ? (
            <>
              {/* Icono */}
              <div className="mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
                  <FaEnvelope className="text-white text-2xl" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                Recuperar <br />
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Contraseña
                </span>
              </h1>

              <p className="text-gray-500 mb-8 text-sm flex items-center gap-2">
                <span className="w-8 h-0.5 bg-blue-500 rounded"></span>
                Te enviaremos instrucciones por correo
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {/* Campo Email */}
                <div className="group">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Botón Enviar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Enviar Instrucciones
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Estado de éxito */
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Correo Enviado!</h2>
              <p className="text-gray-500 mb-6">
                Hemos enviado las instrucciones a <br />
                <span className="font-medium text-gray-700">{email}</span>
              </p>
              
              <p className="text-sm text-gray-400 mb-6">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                Volver al Login
              </button>
            </div>
          )}

          <p className="text-center text-gray-400 text-xs mt-10">
            © {new Date().getFullYear()} <span className="font-medium">TecnoMiguel</span> - Sistema de Inventario y Facturación
          </p>
        </div>

        {/* ---------------------- PANEL DERECHO (IMAGEN) ---------------------- */}
        <div
          className="hidden lg:flex items-center justify-center p-10 bg-gradient-to-br from-blue-100 via-cyan-50 to-green-100 relative overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-90"
            style={{
              backgroundImage: `url(${ImagenFondo})`,
              backgroundSize: '85%',
              backgroundPosition: 'center'
            }}
          ></div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-8">
            <h3 className="text-white text-xl font-bold mb-2">TecnoMiguel</h3>
            <p className="text-white/80 text-sm">
              Innovación y Tecnología a tu Alcance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
