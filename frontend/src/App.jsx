import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./css/App.css";

// TOAST PROVIDER
import ToastProvider from "./components/ToastProvider";
import ToastNotification from "./components/ToastNotification";

// LAYOUT
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardNavigationProvider } from "./hooks/useDashboardNavigation";

// PÁGINAS PÚBLICAS
import Login from "./pages/Login";
import RecuperarClave from "./pages/RecuperarClave";
import CambiarClaveObligatoria from "./pages/CambiarClaveObligatoria";

// PÁGINAS DE ERROR (para rutas fuera del dashboard)
import Error404 from "./pages/Error404";
import Error403 from "./pages/Error403";

export default function AppRouter() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ToastNotification />
        <Routes>

        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />
        <Route path="/cambiar-clave" element={<CambiarClaveObligatoria />} />

        {/* REDIRECCIÓN AL LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* RUTAS PRIVADAS - DASHBOARD (URL siempre será /dashboard) */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowed={["administrador", "empleado", "cliente", "proveedor"]}>
              <DashboardNavigationProvider>
                <DashboardLayout />
              </DashboardNavigationProvider>
            </ProtectedRoute>
          }
        />

        {/* REDIRECCIONES DE RUTAS ANTIGUAS → DASHBOARD */}
        <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
        <Route path="/Productos" element={<Navigate to="/dashboard" replace />} />
        <Route path="/categoria" element={<Navigate to="/dashboard" replace />} />
        <Route path="/facturacion" element={<Navigate to="/dashboard" replace />} />
        <Route path="/ingresos" element={<Navigate to="/dashboard" replace />} />
        <Route path="/egresos" element={<Navigate to="/dashboard" replace />} />

        {/* 403 global (fuera del dashboard) y 404 */}
        <Route path="/403" element={<Error403 />} />
        <Route path="*" element={<Error404 />} />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
