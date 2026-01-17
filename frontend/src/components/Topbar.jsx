import { useEffect, useState, useRef, useCallback } from "react";
import { FaCaretDown } from "react-icons/fa";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";
import Avatar from "./Avatar";

export default function Topbar() {
  const navigate = useNavigate();
  const { navigateTo } = useDashboardNavigation();
  const menuRef = useRef(null);

  const [fecha, setFecha] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => authService.getUser() || { nombre: "Usuario" });

  // Función para actualizar usuario desde localStorage
  const refreshUser = useCallback(() => {
    const updatedUser = authService.getUser();
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, []);

  // Escuchar cambios en localStorage (cuando se actualiza el perfil)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        refreshUser();
      }
    };

    // Escuchar evento personalizado para actualizaciones dentro de la misma pestaña
    const handleUserUpdate = () => {
      refreshUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, [refreshUser]);

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
          <Avatar 
            src={user.avatar_url || user.avatar} 
            name={user.nombre} 
            size="md"
          />
          <span className="capitalize">{user.nombre}</span>
          <FaCaretDown className="text-gray-500" />
        </button>

        {/* MENÚ DESPLEGABLE */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-lg z-50 animate-fadeIn">

            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => {
                setMenuOpen(false);
                navigateTo(DASHBOARD_SECTIONS.PERFIL);
              }}
            >
              🧾 Mi Perfil
            </button>

            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
              onClick={() => {
                setMenuOpen(false);
                navigateTo(DASHBOARD_SECTIONS.CONFIGURACION);
              }}
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
