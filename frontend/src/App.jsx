import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./css/App.css";

// TOAST PROVIDER
import ToastProvider from "./components/ToastProvider";
import ToastNotification from "./components/ToastNotification";

// LAYOUT
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// PÁGINAS PÚBLICAS
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RecuperarClave from "./pages/RecuperarClave";

// PÁGINAS PRIVADAS
import PanelPrincipal from "./pages/PanelPrincipal";
import Inventario from "./pages/Producto"; // O renombra si deseas a Productos
import Categoria from "./pages/Categoria";
import Facturacion from "./pages/Facturacion";
import Ingresos from "./pages/Ingresos";
import Egresos from "./pages/Egresos";
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
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />

        {/* REDIRECCIÓN AL LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* RUTAS PRIVADAS BAJO /dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowed={["administrador", "empleado", "cliente", "proveedor"]}>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Inicio del dashboard */}
          <Route index element={<PanelPrincipal />} />

          {/* Subsecciones con control de roles */}
          <Route
            path="productos"
            element={
              <ProtectedRoute allowed={["administrador", "empleado"]}>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="categoria"
            element={
              <ProtectedRoute allowed={["administrador", "empleado"]}>
                <Categoria />
              </ProtectedRoute>
            }
          />
          <Route
            path="ingresos"
            element={
              <ProtectedRoute allowed={["administrador", "empleado"]}>
                <Ingresos />
              </ProtectedRoute>
            }
          />
          <Route
            path="egresos"
            element={
              <ProtectedRoute allowed={["administrador", "empleado"]}>
                <Egresos />
              </ProtectedRoute>
            }
          />
          <Route
            path="facturacion"
            element={
              <ProtectedRoute allowed={["administrador", "empleado"]}>
                <Facturacion />
              </ProtectedRoute>
            }
          />

          {/* 403 y 404 internos del dashboard */}
          <Route path="forbidden" element={<Error403 />} />
          <Route path="*" element={<Error404 />} />
        </Route>

        {/* REDIRECCIONES DE RUTAS ANTIGUAS → NUEVA ESTRUCTURA */}
        <Route path="/panel" element={<Navigate to="/dashboard" replace />} />
        <Route path="/Productos" element={<Navigate to="/dashboard/productos" replace />} />
        <Route path="/categoria" element={<Navigate to="/dashboard/categoria" replace />} />
        <Route path="/facturacion" element={<Navigate to="/dashboard/facturacion" replace />} />
        <Route path="/ingresos" element={<Navigate to="/dashboard/ingresos" replace />} />
        <Route path="/egresos" element={<Navigate to="/dashboard/egresos" replace />} />

        {/* 403 global (fuera del dashboard) y 404 */}
        <Route path="/403" element={<Error403 />} />
        <Route path="*" element={<Error404 />} />

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
