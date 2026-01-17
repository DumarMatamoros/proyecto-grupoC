import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Contexto para la navegación interna del dashboard
const DashboardNavigationContext = createContext();

// Parámetros vacíos estables (evita re-renders)
const EMPTY_PARAMS = {};

// Secciones disponibles del dashboard
export const DASHBOARD_SECTIONS = {
  PANEL: "panel",
  PRODUCTOS: "productos",
  CATEGORIA: "categoria",
  INGRESOS: "ingresos",
  EGRESOS: "egresos",
  FACTURACION: "facturacion",
  KARDEX: "kardex",
  LOTES: "lotes",
  // Ventas - Submenú
  NUEVA_VENTA: "nueva-venta",
  HISTORIAL_VENTAS: "historial-ventas",
  REPORTE_DIARIO: "reporte-diario",
  // Terceros
  CLIENTES: "clientes",
  PROVEEDORES: "proveedores",
  USUARIOS: "usuarios",
  PERMISOS: "permisos",
  PERMISOS_USUARIO: "permisos-usuario", // Nueva sección para permisos por usuario
  CONFIGURACION: "configuracion",
  PERFIL: "perfil", // Mi Perfil
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not-found",
};

export function DashboardNavigationProvider({ children }) {
  const [currentSection, setCurrentSection] = useState(DASHBOARD_SECTIONS.PANEL);
  const [sectionParams, setSectionParams] = useState(EMPTY_PARAMS); // Parámetros adicionales (ej: usuarioId)
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

  // Navegar a una sección con parámetros opcionales
  const navigateTo = (section, params = null) => {
    setCurrentSection(section);
    setSectionParams(params || EMPTY_PARAMS);
    // La URL permanece como /dashboard
  };

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    currentSection,
    sectionParams,
    navigateTo,
    DASHBOARD_SECTIONS,
  }), [currentSection, sectionParams]);

  return (
    <DashboardNavigationContext.Provider value={contextValue}>
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
