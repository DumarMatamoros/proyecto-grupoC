import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaHome, FaTags, FaBox, FaFileInvoiceDollar, FaShoppingCart, FaCogs, FaSignOutAlt, FaChevronDown, FaChevronRight, FaArrowCircleDown, FaArrowCircleUp, FaWarehouse } from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const inventoryPaths = [
    "/dashboard/productos",
    "/dashboard/categoria",
    "/dashboard/ingresos",
    "/dashboard/egresos",
  ];
  const isInventoryActive = inventoryPaths.some((p) => location.pathname.startsWith(p));
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);

  useEffect(() => {
    setInventoryOpen(isInventoryActive);
  }, [isInventoryActive]);

  const isActive = (path) => {
    // Comparación exacta para evitar múltiples items activos
    return location.pathname === path || 
           (location.pathname.startsWith(path) && path !== "/dashboard");
  };

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
          to="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/dashboard") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaHome /> Panel de Control
        </Link>

        {/* INVENTARIO */}
        <button
          onClick={() => setInventoryOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
            isInventoryActive ? "bg-gray-700" : "hover:bg-gray-800"
          }`}
        >
          <span className="flex items-center gap-3">
            <FaWarehouse /> Inventario
          </span>
          <FaChevronRight
            className={`transition-transform duration-200 ${
              inventoryOpen ? "rotate-90" : "rotate-0"
            }`}
          />
        </button>

        <div
          className={`space-y-3 ml-4 overflow-hidden transition-all duration-200 ${
            inventoryOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
            Gestión
          </div>
          <Link
            to="/dashboard/productos"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive("/dashboard/productos") ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaBox /> Productos
          </Link>
          <Link
            to="/dashboard/categoria"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive("/dashboard/categoria") ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaTags /> Categorías
          </Link>

          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
            Operaciones
          </div>
          <Link
            to="/dashboard/ingresos"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive("/dashboard/ingresos") ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaArrowCircleDown /> Ingresar
          </Link>
          <Link
            to="/dashboard/egresos"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive("/dashboard/egresos") ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaArrowCircleUp /> Deshechar
          </Link>
        </div>

        {/* FACTURACIÓN */}
        <Link
          to="/dashboard/facturacion"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/dashboard/facturacion") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaFileInvoiceDollar /> Facturación
        </Link>

        {/* VENTAS */}
        <Link
          to="/dashboard/ventas"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/dashboard/ventas") ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaShoppingCart /> Ventas
        </Link>

        {/* CONFIGURACIÓN */}
        <Link
          to="/dashboard/configuracion"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive("/dashboard/configuracion") ? "bg-gray-700" : "hover:bg-gray-800"}`}
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
