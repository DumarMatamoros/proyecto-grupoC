import { useEffect, useState } from "react";
import { FaHome, FaTags, FaBox, FaFileInvoiceDollar, FaShoppingCart, FaCogs, FaSignOutAlt, FaChevronRight, FaArrowCircleDown, FaArrowCircleUp, FaWarehouse } from "react-icons/fa";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";

export default function Sidebar() {
  const { currentSection, navigateTo } = useDashboardNavigation();
  
  const inventorySections = [
    DASHBOARD_SECTIONS.PRODUCTOS,
    DASHBOARD_SECTIONS.CATEGORIA,
    DASHBOARD_SECTIONS.INGRESOS,
    DASHBOARD_SECTIONS.EGRESOS,
  ];
  
  const isInventoryActive = inventorySections.includes(currentSection);
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);

  useEffect(() => {
    setInventoryOpen(isInventoryActive);
  }, [isInventoryActive]);

  const isActive = (section) => {
    return currentSection === section;
  };

  const handleNavigation = (section) => {
    navigateTo(section);
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
        <button
          onClick={() => handleNavigation(DASHBOARD_SECTIONS.PANEL)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive(DASHBOARD_SECTIONS.PANEL) ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaHome /> Panel de Control
        </button>

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
          <button
            onClick={() => handleNavigation(DASHBOARD_SECTIONS.PRODUCTOS)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive(DASHBOARD_SECTIONS.PRODUCTOS) ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaBox /> Productos
          </button>
          <button
            onClick={() => handleNavigation(DASHBOARD_SECTIONS.CATEGORIA)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive(DASHBOARD_SECTIONS.CATEGORIA) ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaTags /> Categorías
          </button>

          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
            Operaciones
          </div>
          <button
            onClick={() => handleNavigation(DASHBOARD_SECTIONS.INGRESOS)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive(DASHBOARD_SECTIONS.INGRESOS) ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaArrowCircleDown /> Ingresar
          </button>
          <button
            onClick={() => handleNavigation(DASHBOARD_SECTIONS.EGRESOS)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
              ${isActive(DASHBOARD_SECTIONS.EGRESOS) ? "bg-gray-700" : "hover:bg-gray-800"}`}
          >
            <FaArrowCircleUp /> Deshechar
          </button>
        </div>

        {/* FACTURACIÓN */}
        <button
          onClick={() => handleNavigation(DASHBOARD_SECTIONS.FACTURACION)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive(DASHBOARD_SECTIONS.FACTURACION) ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaFileInvoiceDollar /> Facturación
        </button>

        {/* VENTAS */}
        <button
          onClick={() => handleNavigation(DASHBOARD_SECTIONS.VENTAS)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive(DASHBOARD_SECTIONS.VENTAS) ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaShoppingCart /> Ventas
        </button>

        {/* CONFIGURACIÓN */}
        <button
          onClick={() => handleNavigation(DASHBOARD_SECTIONS.CONFIGURACION)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
            ${isActive(DASHBOARD_SECTIONS.CONFIGURACION) ? "bg-gray-700" : "hover:bg-gray-800"}`}
        >
          <FaCogs /> Configuración
        </button>
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
