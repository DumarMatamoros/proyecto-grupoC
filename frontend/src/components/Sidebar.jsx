import { Link, useLocation } from "react-router-dom";
import { FaHome, FaTags, FaBox, FaFileInvoiceDollar, FaShoppingCart, FaCogs, FaSignOutAlt } from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="h-screen w-64 bg-gray-900 text-white flex flex-col shadow-xl">

      {/* LOGO / TÍTULO */}
      <div className="px-6 py-5 text-xl font-bold border-b border-gray-700">
        PANEL ADMIN
      </div>

      {/* MENÚ */}
      <nav className="flex-1 px-4 py-4 space-y-2">

        {/* PANEL */}
        <Link
          to="/panel"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/panel") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaHome /> Panel de Control
        </Link>

        {/* CATEGORÍAS */}
        <Link
          to="/categoria"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/categoria") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaTags /> Categorías
        </Link>

        {/* PRODUCTOS*/}
        <Link
          to="/Productos"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/Productos") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaBox /> Productos
        </Link>

        {/* FACTURACIÓN */}
        <Link
          to="/facturacion"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/facturacion") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaFileInvoiceDollar /> Facturación
        </Link>

        {/* VENTAS */}
        <Link
          to="/ventas"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/ventas") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaShoppingCart /> Ventas
        </Link>

        {/* CONFIGURACIÓN */}
        <Link
          to="/configuracion"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/configuracion") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaCogs /> Configuración
        </Link>
      </nav>

      {/* CERRAR SESIÓN */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </div>

    </aside>
  );
}
