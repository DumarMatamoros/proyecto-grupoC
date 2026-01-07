import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import authService from "../services/authService";

export default function ProtectedRoute({ children, allowed = [] }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!authService.isAuthenticated()) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      const user = await authService.ensureAuth();
      if (!mounted) return;

      if (!user) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      // Verificar si debe cambiar contraseña
      if (user.must_change_password || authService.mustChangePassword()) {
        setMustChangePassword(true);
        setChecking(false);
        return;
      }

      const ok = authService.hasRole(allowed);
      setAuthorized(ok);
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (checking) return null;

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Si debe cambiar contraseña, redirigir a la página de cambio
  if (mustChangePassword) {
    return <Navigate to="/cambiar-clave" replace />;
  }

  if (!authorized) {
    // sin permiso → a pantalla 403 dentro del dashboard
    return <Navigate to="/dashboard/forbidden" replace />;
  }

  return children;
}
