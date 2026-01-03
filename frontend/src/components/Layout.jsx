import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
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

  return (
    <div className="flex h-screen w-full">

      {/* SIDEBAR */}
      <aside 
        className={`flex-shrink-0 bg-white border-r shadow-md transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-col flex-1 min-w-0 h-full">

        {/* TOPBAR */}
        <header className="h-16 flex-shrink-0 bg-white shadow flex items-center px-6">
          <Topbar />
        </header>

        {/* CONTENIDO DE LAS PÁGINAS */}
        <main className="flex-1 overflow-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
