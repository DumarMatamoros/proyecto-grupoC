import { useEffect, useState } from "react";
import { 
  FaHome, 
  FaTags, 
  FaBox, 
  FaFileInvoiceDollar, 
  FaShoppingCart, 
  FaCogs, 
  FaSignOutAlt, 
  FaChevronRight, 
  FaArrowCircleDown, 
  FaArrowCircleUp, 
  FaWarehouse,
  FaBars,
  FaClipboardList,
  FaTrashAlt,
  FaBoxes,
  FaUsers,
  FaUserShield,
  FaUsersCog,
  FaListUl,
  FaTruck,
  FaAddressBook
} from "react-icons/fa";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";
import authService from "../services/authService";

export default function SidebarDashboard({ collapsed = false, onToggle }) {
  const { currentSection, navigateTo } = useDashboardNavigation();
  const currentUser = authService.getUser();
  const isAdmin = currentUser?.tipo === "administrador";
  
  // Secciones que pertenecen a Inventario (incluyendo Kardex y Lotes)
  const inventorySections = [
    DASHBOARD_SECTIONS.PRODUCTOS,
    DASHBOARD_SECTIONS.CATEGORIA,
    DASHBOARD_SECTIONS.KARDEX,
    DASHBOARD_SECTIONS.LOTES,
    DASHBOARD_SECTIONS.INGRESOS,
    DASHBOARD_SECTIONS.EGRESOS,
  ];

  // Secciones de Terceros (Clientes y Proveedores)
  const tercerosSections = [
    DASHBOARD_SECTIONS.CLIENTES,
    DASHBOARD_SECTIONS.PROVEEDORES,
  ];
  
  // Secciones de Gestión de Acceso
  const accessSections = [
    DASHBOARD_SECTIONS.USUARIOS,
    DASHBOARD_SECTIONS.PERMISOS,
  ];
  
  const isInventoryActive = inventorySections.includes(currentSection);
  const isTercerosActive = tercerosSections.includes(currentSection);
  const isAccessActive = accessSections.includes(currentSection);
  
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);
  const [tercerosOpen, setTercerosOpen] = useState(isTercerosActive);
  const [accessOpen, setAccessOpen] = useState(isAccessActive);

  useEffect(() => {
    setInventoryOpen(isInventoryActive);
  }, [isInventoryActive]);

  useEffect(() => {
    setTercerosOpen(isTercerosActive);
  }, [isTercerosActive]);

  useEffect(() => {
    setAccessOpen(isAccessActive);
  }, [isAccessActive]);

  // Cerrar submenús cuando se colapsa
  useEffect(() => {
    if (collapsed) {
      setInventoryOpen(false);
      setTercerosOpen(false);
      setAccessOpen(false);
    }
  }, [collapsed]);

  const isActive = (section) => {
    return currentSection === section;
  };

  const handleNavigation = (section) => {
    navigateTo(section);
  };

  // Componente para item del menú
  const MenuItem = ({ section, icon: Icon, label }) => (
    <button
      onClick={() => handleNavigation(section)}
      title={collapsed ? label : ""}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition 
        ${isActive(section) ? "bg-gray-700" : "hover:bg-gray-800"}
        ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="text-lg flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
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
        <MenuItem section={DASHBOARD_SECTIONS.PANEL} icon={FaHome} label="Panel de Control" />

        {/* INVENTARIO - Menú desplegable */}
        <button
          onClick={() => {
            if (collapsed) {
              onToggle();
              setInventoryOpen(true);
            } else {
              setInventoryOpen((prev) => !prev);
            }
          }}
          title={collapsed ? "Inventario" : ""}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition ${
            isInventoryActive ? "bg-gray-700" : "hover:bg-gray-800"
          } ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <span className="flex items-center gap-3">
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

        {/* Submenú de Inventario */}
        {!collapsed && (
          <div
            className={`space-y-1 ml-4 overflow-hidden transition-all duration-200 ${
              inventoryOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {/* Gestión */}
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
              Gestión
            </div>
            <MenuItem section={DASHBOARD_SECTIONS.PRODUCTOS} icon={FaBox} label="Productos" />
            <MenuItem section={DASHBOARD_SECTIONS.KARDEX} icon={FaClipboardList} label="Movimientos" />
            <MenuItem section={DASHBOARD_SECTIONS.CATEGORIA} icon={FaTags} label="Categorías" />
            <MenuItem section={DASHBOARD_SECTIONS.LOTES} icon={FaBoxes} label="Lotes" />

            {/* Operaciones */}
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2 pt-2">
              Operaciones
            </div>
            <MenuItem section={DASHBOARD_SECTIONS.INGRESOS} icon={FaArrowCircleDown} label="Ingresar Stock" />
            <MenuItem section={DASHBOARD_SECTIONS.EGRESOS} icon={FaTrashAlt} label="Desechar" />
          </div>
        )}

        {/* FACTURACIÓN */}
        <MenuItem section={DASHBOARD_SECTIONS.FACTURACION} icon={FaFileInvoiceDollar} label="Facturación" />

        {/* VENTAS */}
        <MenuItem section={DASHBOARD_SECTIONS.VENTAS} icon={FaShoppingCart} label="Ventas" />

        {/* TERCEROS - Clientes y Proveedores */}
        <button
          onClick={() => {
            if (collapsed) {
              onToggle();
              setTercerosOpen(true);
            } else {
              setTercerosOpen((prev) => !prev);
            }
          }}
          title={collapsed ? "Terceros" : ""}
          className={`w-full flex items-center px-3 py-2 rounded-lg transition ${
            isTercerosActive ? "bg-gray-700" : "hover:bg-gray-800"
          } ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <span className="flex items-center gap-3">
            <FaAddressBook className="text-lg flex-shrink-0" />
            {!collapsed && <span>Terceros</span>}
          </span>
          {!collapsed && (
            <FaChevronRight
              className={`transition-transform duration-200 ${
                tercerosOpen ? "rotate-90" : "rotate-0"
              }`}
            />
          )}
        </button>

        {/* Submenú de Terceros */}
        {!collapsed && (
          <div
            className={`space-y-1 ml-4 overflow-hidden transition-all duration-200 ${
              tercerosOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <MenuItem section={DASHBOARD_SECTIONS.CLIENTES} icon={FaUsers} label="Clientes" />
            <MenuItem section={DASHBOARD_SECTIONS.PROVEEDORES} icon={FaTruck} label="Proveedores" />
          </div>
        )}

        {/* GESTIÓN DE ACCESO - Solo visible para administradores */}
        {isAdmin && (
          <>
            <button
              onClick={() => {
                if (collapsed) {
                  onToggle();
                  setAccessOpen(true);
                } else {
                  setAccessOpen((prev) => !prev);
                }
              }}
              title={collapsed ? "Gestión de Acceso" : ""}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition ${
                isAccessActive ? "bg-gray-700" : "hover:bg-gray-800"
              } ${collapsed ? "justify-center" : "justify-between"}`}
            >
              <span className="flex items-center gap-3">
                <FaUsersCog className="text-lg flex-shrink-0" />
                {!collapsed && <span>Gestión de Acceso</span>}
              </span>
              {!collapsed && (
                <FaChevronRight
                  className={`transition-transform duration-200 ${
                    accessOpen ? "rotate-90" : "rotate-0"
                  }`}
                />
              )}
            </button>

            {/* Submenú de Gestión de Acceso */}
            {!collapsed && (
              <div
                className={`space-y-1 ml-4 overflow-hidden transition-all duration-200 ${
                  accessOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <MenuItem section={DASHBOARD_SECTIONS.USUARIOS} icon={FaListUl} label="Lista de Usuarios" />
                <MenuItem section={DASHBOARD_SECTIONS.PERMISOS} icon={FaUserShield} label="Roles y Permisos" />
              </div>
            )}
          </>
        )}

        {/* CONFIGURACIÓN */}
        <MenuItem section={DASHBOARD_SECTIONS.CONFIGURACION} icon={FaCogs} label="Configuración" />
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
