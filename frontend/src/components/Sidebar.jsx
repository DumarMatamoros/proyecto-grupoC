import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  FaHome, 
  FaTags, 
  FaBox, 
  FaFileInvoiceDollar, 
  FaShoppingCart, 
  FaCogs, 
  FaSignOutAlt, 
  FaChevronDown, 
  FaChevronRight, 
  FaArrowCircleDown, 
  FaArrowCircleUp, 
  FaWarehouse,
  FaBars 
} from "react-icons/fa";

export default function Sidebar({ collapsed = false, onToggle }) {
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

  // Cerrar submenús cuando se colapsa
  useEffect(() => {
    if (collapsed) {
      setInventoryOpen(false);
    }
  }, [collapsed]);

  const isActive = (path) => {
    return location.pathname === path || 
           (location.pathname.startsWith(path) && path !== "/dashboard");
  };

  // Componente para item del menú
  const MenuItem = ({ to, icon: Icon, label, active }) => (
    <Link
      to={to}
      title={collapsed ? label : ""}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition 
        ${active ? "bg-gray-700" : "hover:bg-gray-800"}
        ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="text-lg flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <aside className={`h-screen bg-gray-900 text-white flex flex-col shadow-xl transition-all duration-300 ${
      collapsed ? "w-16" : "w-64"
    }`}>

      {/* LOGO / TÍTULO CON BOTÓN DE TOGGLE */}
      <div className={`py-5 border-b border-gray-700 flex items-center ${
        collapsed ? "px-3 justify-center" : "px-4 justify-between"
      }`}>
        {!collapsed && (
          <span className="text-xl font-bold whitespace-nowrap">PANEL ADMIN</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <FaBars className="text-lg" />
        </button>
      </div>

      {/* MENÚ */}
      <nav className={`flex-1 py-4 space-y-2 overflow-y-auto ${collapsed ? "px-2" : "px-4"}`}>

        {/* PANEL */}
        <MenuItem 
          to="/dashboard" 
          icon={FaHome} 
          label="Panel de Control" 
          active={isActive("/dashboard")} 
        />

        {/* INVENTARIO */}
        <button
          onClick={() => !collapsed && setInventoryOpen((prev) => !prev)}
          title={collapsed ? "Inventario" : ""}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition ${
            isInventoryActive ? "bg-gray-700" : "hover:bg-gray-800"
          } ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <span className={`flex items-center gap-3 ${collapsed ? "" : ""}`}>
            <FaWarehouse className="text-lg flex-shrink-0" />
            {!collapsed && <span>Inventario</span>}
          </span>
          {!collapsed && (
            <FaChevronRight
              className={`transition-transform duration-200 ${
                inventoryOpen ? "rotate-90" : "rotate-0"
              }`}
            />
          )}
        </button>

        {/* Submenú de inventario - solo visible cuando no está colapsado */}
        {!collapsed && (
          <div
            className={`space-y-1 ml-4 overflow-hidden transition-all duration-200 ${
              inventoryOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
              Gestión
            </div>
            <MenuItem 
              to="/dashboard/productos" 
              icon={FaBox} 
              label="Productos" 
              active={isActive("/dashboard/productos")} 
            />
            <MenuItem 
              to="/dashboard/categoria" 
              icon={FaTags} 
              label="Categorías" 
              active={isActive("/dashboard/categoria")} 
            />

            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
              Operaciones
            </div>
            <MenuItem 
              to="/dashboard/ingresos" 
              icon={FaArrowCircleDown} 
              label="Ingresar" 
              active={isActive("/dashboard/ingresos")} 
            />
            <MenuItem 
              to="/dashboard/egresos" 
              icon={FaArrowCircleUp} 
              label="Deshechar" 
              active={isActive("/dashboard/egresos")} 
            />
          </div>
        )}

        {/* FACTURACIÓN */}
        <MenuItem 
          to="/dashboard/facturacion" 
          icon={FaFileInvoiceDollar} 
          label="Facturación" 
          active={isActive("/dashboard/facturacion")} 
        />

        {/* VENTAS */}
        <MenuItem 
          to="/dashboard/ventas" 
          icon={FaShoppingCart} 
          label="Ventas" 
          active={isActive("/dashboard/ventas")} 
        />

        {/* CONFIGURACIÓN */}
        <MenuItem 
          to="/dashboard/configuracion" 
          icon={FaCogs} 
          label="Configuración" 
          active={isActive("/dashboard/configuracion")} 
        />
      </nav>

      {/* CERRAR SESIÓN */}
      <div className={`p-4 border-t border-gray-700 ${collapsed ? "px-2" : ""}`}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          title={collapsed ? "Cerrar sesión" : ""}
          className={`flex items-center gap-3 w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <FaSignOutAlt className="text-lg flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>

    </aside>
  );
}
