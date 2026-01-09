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
  FaChevronRight, 
  FaTruckLoading,
  FaExclamationTriangle,
  FaWarehouse,
  FaBars,
  FaChartLine,
  FaLayerGroup,
  FaBell,
  FaCalendarTimes
} from "react-icons/fa";
import api from "../services/api";

export default function Sidebar({ collapsed = false, onToggle }) {
  const location = useLocation();
  
  // Estados para contadores
  const [counters, setCounters] = useState({
    productos: 0,
    categorias: 0,
    lotes: 0,
    stockBajo: 0,
    lotesVencidos: 0,
    proximosVencer: 0,
  });

  // Rutas de inventario
  const inventoryPaths = [
    "/dashboard/productos",
    "/dashboard/categoria",
    "/dashboard/ingresos",
    "/dashboard/egresos",
    "/dashboard/kardex",
    "/dashboard/lotes",
  ];
  const isInventoryActive = inventoryPaths.some((p) => location.pathname.startsWith(p));
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);

  // Cargar contadores
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const [productosRes, categoriasRes, lotesRes] = await Promise.all([
          api.get("/productos"),
          api.get("/categorias"),
          api.get("/lotes/resumen").catch(() => ({ data: {} })),
        ]);

        const productos = productosRes.data || [];
        const stockBajo = productos.filter(p => p.stock_actual <= 5).length;

        setCounters({
          productos: productos.length,
          categorias: categoriasRes.data?.length || 0,
          lotes: lotesRes.data?.total_lotes_activos || 0,
          stockBajo,
          lotesVencidos: lotesRes.data?.vencidos?.count || 0,
          proximosVencer: lotesRes.data?.proximos_a_vencer?.count || 0,
        });
      } catch (error) {
        console.log("Error cargando contadores del sidebar");
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setInventoryOpen(isInventoryActive);
  }, [isInventoryActive]);

  useEffect(() => {
    if (collapsed) {
      setInventoryOpen(false);
    }
  }, [collapsed]);

  const isActive = (path) => {
    return location.pathname === path || 
           (location.pathname.startsWith(path) && path !== "/dashboard");
  };

  // Badge con contador
  const Badge = ({ count, color = "bg-gray-600" }) => {
    if (!count && count !== 0) return null;
    return (
      <span className={`${color} text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center`}>
        {count > 999 ? '999+' : count}
      </span>
    );
  };

  // Badge de alerta
  const AlertBadge = ({ count }) => {
    if (!count) return null;
    return (
      <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
        {count}
      </span>
    );
  };

  // Componente para item del menú
  const MenuItem = ({ to, icon: Icon, label, active, badge, alertBadge, iconColor = "" }) => (
    <Link
      to={to}
      title={collapsed ? label : ""}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${active ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg" : "hover:bg-gray-800/70"}
        ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className={`text-lg flex-shrink-0 ${iconColor}`} />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {alertBadge ? <AlertBadge count={alertBadge} /> : badge !== undefined && <Badge count={badge} />}
        </>
      )}
    </Link>
  );

  // Separador de sección
  const SectionLabel = ({ label, icon: Icon, color = "text-blue-400" }) => (
    <div className={`flex items-center gap-2 text-xs font-semibold ${color} uppercase tracking-wider px-2 pt-3 pb-1`}>
      {Icon && <Icon className="text-xs" />}
      <span>{label}</span>
    </div>
  );

  return (
    <aside className={`h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white flex flex-col shadow-2xl transition-all duration-300 ${
      collapsed ? "w-16" : "w-72"
    }`}>

      {/* LOGO / TÍTULO */}
      <div className={`py-5 border-b border-gray-700/50 flex items-center ${
        collapsed ? "px-3 justify-center" : "px-4 justify-between"
      }`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaWarehouse className="text-lg" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wide">INVENTORY</span>
              <p className="text-[10px] text-gray-400 -mt-1">Sistema de Gestión</p>
            </div>
          </div>
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
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar ${collapsed ? "px-2" : "px-3"}`}>

        {/* PANEL DE CONTROL */}
        <MenuItem 
          to="/dashboard" 
          icon={FaHome} 
          label="Panel de Control" 
          active={location.pathname === "/dashboard"} 
          iconColor="text-white"
        />

        {/* ========== INVENTARIO ========== */}
        <button
          onClick={() => !collapsed && setInventoryOpen((prev) => !prev)}
          title={collapsed ? "Inventario" : ""}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isInventoryActive ? "bg-blue-600/20 border-l-4 border-blue-500" : "hover:bg-gray-800/70"
          } ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <span className="flex items-center gap-3">
            <FaWarehouse className="text-lg text-blue-400" />
            {!collapsed && <span className="font-medium">Inventario</span>}
          </span>
          {!collapsed && (
            <div className="flex items-center gap-2">
              {(counters.stockBajo > 0 || counters.lotesVencidos > 0) && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <FaChevronRight
                className={`transition-transform duration-200 text-sm ${
                  inventoryOpen ? "rotate-90" : "rotate-0"
                }`}
              />
            </div>
          )}
        </button>

        {/* Submenú de inventario */}
        {!collapsed && (
          <div
            className={`space-y-0.5 ml-2 pl-2 border-l border-gray-700/50 overflow-hidden transition-all duration-300 ${
              inventoryOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <SectionLabel label="Gestión" icon={FaLayerGroup} />
            <MenuItem 
              to="/dashboard/productos" 
              icon={FaBox} 
              label="Productos" 
              active={isActive("/dashboard/productos")}
              badge={counters.productos}
            />
            <MenuItem 
              to="/dashboard/kardex" 
              icon={FaChartLine} 
              label="Movimientos" 
              active={isActive("/dashboard/kardex")}
              iconColor="text-cyan-400"
            />
            <MenuItem 
              to="/dashboard/categoria" 
              icon={FaTags} 
              label="Categorías" 
              active={isActive("/dashboard/categoria")}
              badge={counters.categorias}
            />
            <MenuItem 
              to="/dashboard/lotes" 
              icon={FaLayerGroup} 
              label="Lotes" 
              active={isActive("/dashboard/lotes")}
              badge={counters.lotes}
              iconColor="text-purple-400"
            />

            <SectionLabel label="Operaciones" icon={FaTruckLoading} color="text-green-400" />
            <MenuItem 
              to="/dashboard/ingresos" 
              icon={FaTruckLoading} 
              label="Recepción de Mercadería" 
              active={isActive("/dashboard/ingresos")}
              iconColor="text-green-400"
            />
            <MenuItem 
              to="/dashboard/egresos" 
              icon={FaExclamationTriangle} 
              label="Ajustes / Mermas" 
              active={isActive("/dashboard/egresos")}
              iconColor="text-orange-400"
            />

            <SectionLabel label="Alertas" icon={FaBell} color="text-red-400" />
            <MenuItem 
              to="/dashboard/productos?filter=stock_bajo" 
              icon={FaBell} 
              label="Stock Bajo" 
              active={false}
              alertBadge={counters.stockBajo}
              iconColor="text-yellow-400"
            />
            <MenuItem 
              to="/dashboard/lotes?filter=vencidos" 
              icon={FaCalendarTimes} 
              label="Lotes Vencidos" 
              active={false}
              alertBadge={counters.lotesVencidos}
              iconColor="text-red-400"
            />
          </div>
        )}

        {/* ========== VENTAS ========== */}
        {!collapsed && <SectionLabel label="Ventas" icon={FaShoppingCart} color="text-green-400" />}
        <MenuItem 
          to="/dashboard/facturacion" 
          icon={FaFileInvoiceDollar} 
          label="Punto de Venta" 
          active={isActive("/dashboard/facturacion")}
          iconColor="text-green-400"
        />
        <MenuItem 
          to="/dashboard/ventas" 
          icon={FaShoppingCart} 
          label="Historial de Ventas" 
          active={isActive("/dashboard/ventas")}
          iconColor="text-green-400"
        />

        {/* ========== SISTEMA ========== */}
        {!collapsed && <SectionLabel label="Sistema" icon={FaCogs} color="text-gray-400" />}
        <MenuItem 
          to="/dashboard/configuracion" 
          icon={FaCogs} 
          label="Configuración" 
          active={isActive("/dashboard/configuracion")}
          iconColor="text-gray-400"
        />
      </nav>

      {/* ROL DEL USUARIO */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-gray-700/50">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-[10px] text-gray-400">Acceso completo</p>
            </div>
          </div>
        </div>
      )}

      {/* CERRAR SESIÓN */}
      <div className={`p-3 border-t border-gray-700/50 ${collapsed ? "px-2" : ""}`}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          title={collapsed ? "Cerrar sesión" : ""}
          className={`flex items-center gap-3 w-full px-3 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all duration-200 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <FaSignOutAlt className="text-lg flex-shrink-0" />
          {!collapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>

    </aside>
  );
}
