import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Ej: http://127.0.0.1:8000/api
  timeout: 8000,
});

// AGREGAR TOKEN AUTOMÁTICAMENTE
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPUESTA PARA ERRORES DE AUTENTICACIÓN/AUTORIZACIÓN
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error || {};

    if (response) {
      if (response.status === 401 || response.status === 419) {
        // Sesión inválida/expirada → limpiar y redirigir a login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
      if (response.status === 403) {
        // Sin permisos → llevar a pantalla 403 dentro del dashboard
        if (localStorage.getItem("token")) {
          if (window.location.pathname !== "/dashboard/forbidden") {
            window.location.replace("/dashboard/forbidden");
          }
        } else {
          window.location.replace("/403");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
