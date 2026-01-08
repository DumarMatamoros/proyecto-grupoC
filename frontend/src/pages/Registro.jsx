import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ImagenFondo from "../image/PNG FONDO.png";
import useToast from "../hooks/useToast";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserTag, FaArrowLeft, FaUserPlus, FaIdCard, FaPhone } from "react-icons/fa";

export default function Registro() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    tipo: "empleado",
    cedula: "",
    telefono: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validaciones
    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      toast.error("La contraseña debe tener al menos 8 caracteres");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Las contraseñas no coinciden");
      toast.error("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        nombre: formData.nombre,
        email: formData.email,
        tipo: formData.tipo.toLowerCase(),
        cedula: formData.cedula,
        telefono: formData.telefono,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión");
      navigate("/login");
    } catch (err) {
      const mensaje = err.response?.data?.message || "Error al registrar usuario";
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Tipos de cuenta para sistema de inventario
  const tiposCuenta = [
    { value: "administrador", label: "Administrador", desc: "Acceso total al sistema" },
    { value: "empleado", label: "Empleado / Cajero", desc: "Ventas e inventario" },
    { value: "bodeguero", label: "Bodeguero", desc: "Gestión de inventario" },
    { value: "contador", label: "Contador", desc: "Reportes y facturación" },
    { value: "cliente", label: "Cliente", desc: "Ver sus compras" },
    { value: "proveedor", label: "Proveedor", desc: "Gestionar pedidos" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Efectos de fondo decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div 
        className={`bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 transform transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* ---------------------- FORMULARIO ---------------------- */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          
          {/* Botón volver */}
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors mb-4 w-fit"
          >
            <FaArrowLeft />
            <span className="text-sm">Volver al inicio</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
            Crear <br /> 
            <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
              Nueva Cuenta
            </span>
          </h1>

          <p className="text-gray-500 mb-6 text-sm flex items-center gap-2">
            <span className="w-8 h-0.5 bg-green-500 rounded"></span>
            Completa tus datos para registrarte
          </p>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            
            {/* Nombre y Cédula en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo Nombre */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* Campo Cédula */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Cédula / RUC
                </label>
                <input
                  type="text"
                  name="cedula"
                  placeholder="0912345678"
                  value={formData.cedula}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {/* Email y Teléfono en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* Campo Teléfono */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  placeholder="0991234567"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Campo Tipo de Usuario */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Tipo de Cuenta
              </label>
              <div className="relative">
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white appearance-none cursor-pointer text-sm pr-10"
                  required
                >
                  {tiposCuenta.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label} - {tipo.desc}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Campos de Contraseña en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo Contraseña */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-green-500 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword2 ? "text" : "password"}
                    name="password_confirmation"
                    placeholder="Repetir contraseña"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-green-500 transition-colors"
                  >
                    {showPassword2 ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón de Registro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white py-3 rounded-lg font-semibold shadow-lg shadow-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Crear mi Cuenta
                </>
              )}
            </button>
          </form>

          {/* Link a login */}
          <p className="text-center text-gray-500 text-sm mt-5">
            ¿Ya tienes una cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors"
            >
              Iniciar Sesión
            </button>
          </p>

          <p className="text-center text-gray-400 text-xs mt-3">
            © {new Date().getFullYear()} <span className="font-medium">TecnoMiguel</span>
          </p>
        </div>

        {/* ---------------------- PANEL DERECHO (IMAGEN) ---------------------- */}
        <div
          className="hidden lg:flex items-center justify-center p-10 bg-gradient-to-br from-green-100 via-cyan-50 to-blue-100 relative overflow-hidden"
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
            <h3 className="text-white text-xl font-bold mb-2">¡Únete a TecnoMiguel!</h3>
            <p className="text-white/80 text-sm">
              Gestiona tu inventario de forma fácil y eficiente
            </p>
          </div>

          <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <span className="text-sm font-medium text-green-600">Registro</span>
          </div>
        </div>
      </div>
    </div>
  );
}
