import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen w-full">

      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-white border-r shadow-md">
        <Sidebar />
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
