import { useState, useEffect } from "react";
import SidebarDashboard from "./SidebarDashboard";
import Topbar from "./Topbar";
import { useDashboardNavigation, DASHBOARD_SECTIONS } from "../hooks/useDashboardNavigation";

// Importar las páginas
import PanelPrincipal from "../pages/PanelPrincipal";
import Inventario from "../pages/Producto";
import Categoria from "../pages/Categoria";
import Facturacion from "../pages/Facturacion";
import Ingresos from "../pages/Ingresos";
import Egresos from "../pages/Egresos";
import Kardex from "../pages/Kardex";
import Lotes from "../pages/Lotes";
import Error403 from "../pages/Error403";
import Error404 from "../pages/Error404";

// Mapa de componentes por sección
const sectionComponents = {
  [DASHBOARD_SECTIONS.PANEL]: PanelPrincipal,
  [DASHBOARD_SECTIONS.PRODUCTOS]: Inventario,
  [DASHBOARD_SECTIONS.CATEGORIA]: Categoria,
  [DASHBOARD_SECTIONS.INGRESOS]: Ingresos,
  [DASHBOARD_SECTIONS.EGRESOS]: Egresos,
  [DASHBOARD_SECTIONS.FACTURACION]: Facturacion,
  [DASHBOARD_SECTIONS.KARDEX]: Kardex,
  [DASHBOARD_SECTIONS.LOTES]: Lotes,
  [DASHBOARD_SECTIONS.FORBIDDEN]: Error403,
  [DASHBOARD_SECTIONS.NOT_FOUND]: Error404,
};

// Roles permitidos por sección
const sectionRoles = {
  [DASHBOARD_SECTIONS.PANEL]: ["administrador", "empleado", "cliente", "proveedor"],
  [DASHBOARD_SECTIONS.PRODUCTOS]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.CATEGORIA]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.INGRESOS]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.EGRESOS]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.FACTURACION]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.KARDEX]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.LOTES]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.VENTAS]: ["administrador", "empleado"],
  [DASHBOARD_SECTIONS.CONFIGURACION]: ["administrador"],
};

export default function DashboardLayout() {
  const { currentSection, navigateTo } = useDashboardNavigation();

  // Estado del sidebar - persistido en localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Guardar estado en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Obtener el rol del usuario
  const getUserRole = () => {
    try {
      const userDataString = localStorage.getItem("user");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        return userData.tipo || null;
      }
    } catch {
      return null;
    }
    return null;
  };

  const userRole = getUserRole();

  // Verificar si el usuario tiene permiso para la sección actual
  const allowedRoles = sectionRoles[currentSection] || [];
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  // Obtener el componente a renderizar
  let ContentComponent;
  if (!hasAccess) {
    ContentComponent = Error403;
  } else {
    ContentComponent = sectionComponents[currentSection] || Error404;
  }

  return (
    <div className="flex h-screen w-full">

      {/* SIDEBAR */}
      <aside className={`flex-shrink-0 bg-white border-r shadow-md transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        <SidebarDashboard collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* TOPBAR */}
        <header className="h-16 flex-shrink-0 bg-white shadow flex items-center px-6">
          <Topbar />
        </header>

        {/* CONTENIDO DE LAS PÁGINAS */}
        <main className="flex-1 overflow-auto bg-gray-100 p-6">
          <ContentComponent />
        </main>
      </div>
    </div>
  );
}
