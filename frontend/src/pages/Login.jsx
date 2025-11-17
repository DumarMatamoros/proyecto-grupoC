import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ImagenFondo from "../image/PNG FONDO.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await authService.login(email, password);
      navigate("/panel");
    } catch (err) {
      setError("Credenciales incorrectas");
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
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold shadow-md transition"
          >
            Ingresar
          </button>
        </form>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-5 py-3 rounded-xl font-semibold transition"
          onClick={() => navigate("/registro")}
        >
          Crear Usuario
        </button>

        <button
          className="w-full mt-4 text-sm text-blue-600 hover:underline"
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
