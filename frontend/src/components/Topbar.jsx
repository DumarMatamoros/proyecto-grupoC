import { useEffect, useState, useRef } from "react";
import { FaUserCircle, FaCaretDown } from "react-icons/fa";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [fecha, setFecha] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Obtener usuario
  const user = authService.getUser() || { nombre: "Usuario" };

  // Actualizar fecha/hora cada 1s
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date();
      const fechaFormateada = ahora.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const hora = ahora.toLocaleTimeString("es-ES");
      setFecha(`${fechaFormateada} • ${hora}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cerrar sesión
  const logout = () => {
    authService.logout();
    navigate("/login");
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white shadow-md flex justify-between items-center px-6 h-16">

      {/* FECHA Y HORA */}
      <div className="text-gray-600 text-sm font-semibold">{fecha}</div>

      {/* USUARIO */}
      <div className="relative" ref={menuRef}>
        <button
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition font-medium"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FaUserCircle className="text-3xl text-gray-700" />
          <span className="capitalize">{user.nombre}</span>
          <FaCaretDown className="text-gray-500" />
        </button>

        {/* MENÚ DESPLEGABLE */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-lg z-50 animate-fadeIn">

            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => navigate("/perfil")}
            >
              🧾 Mi Perfil
            </button>

            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => navigate("/configuracion")}
            >
              ⚙️ Configuración
            </button>

            <button
              className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 font-bold"
              onClick={logout}
            >
              🔓 Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
