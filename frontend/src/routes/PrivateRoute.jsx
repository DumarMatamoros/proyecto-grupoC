import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  // Si no hay token, redirigimos a la página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Si hay token (usuario autenticado), renderizamos los hijos (componente protegido)
  return children;
}

export default PrivateRoute;
