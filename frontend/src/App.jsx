import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./css/App.css";

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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-clave" element={<RecuperarClave />} />

        {/* REDIRECCIÓN AL LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* RUTAS PRIVADAS (DENTRO DEL LAYOUT) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/panel" element={<PanelPrincipal />} />
          <Route path="/Productos" element={<Inventario />} />
          <Route path="/categoria" element={<Categoria />} />
          <Route path="/facturacion" element={<Facturacion />} />
        </Route>

        {/* SI LA RUTA NO EXISTE → LOGIN */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
