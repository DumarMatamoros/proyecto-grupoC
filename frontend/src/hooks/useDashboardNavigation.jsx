import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Contexto para la navegación interna del dashboard
const DashboardNavigationContext = createContext();

// Secciones disponibles del dashboard
export const DASHBOARD_SECTIONS = {
  PANEL: "panel",
  PRODUCTOS: "productos",
  CATEGORIA: "categoria",
  INGRESOS: "ingresos",
  EGRESOS: "egresos",
  FACTURACION: "facturacion",
  VENTAS: "ventas",
  CONFIGURACION: "configuracion",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not-found",
};

export function DashboardNavigationProvider({ children }) {
  const [currentSection, setCurrentSection] = useState(DASHBOARD_SECTIONS.PANEL);
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // Si el usuario intenta acceder directamente a una sub-ruta, redirigir a /dashboard
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (location.pathname.startsWith("/dashboard") && location.pathname !== "/dashboard") {
      // Extraer la sección de la URL para mantener el estado correcto
      const path = location.pathname.replace("/dashboard/", "").replace("/dashboard", "");
      const section = Object.values(DASHBOARD_SECTIONS).find(s => s === path);
      if (section) {
        setCurrentSection(section);
      }
      // Redirigir a /dashboard sin cambiar la sección actual
      navigate("/dashboard", { replace: true });
      hasInitialized.current = true;
    } else if (location.pathname === "/dashboard") {
      hasInitialized.current = true;
    }
  }, [location.pathname, navigate]);

  const navigateTo = (section) => {
    setCurrentSection(section);
    // La URL permanece como /dashboard
  };

  return (
    <DashboardNavigationContext.Provider value={{ currentSection, navigateTo, DASHBOARD_SECTIONS }}>
      {children}
    </DashboardNavigationContext.Provider>
  );
}

export function useDashboardNavigation() {
  const context = useContext(DashboardNavigationContext);
  if (!context) {
    throw new Error("useDashboardNavigation debe usarse dentro de DashboardNavigationProvider");
  }
  return context;
}
