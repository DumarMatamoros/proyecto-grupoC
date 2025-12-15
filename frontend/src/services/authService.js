import api from "./api";

const authService = {
  login: async (email, password) => {
    const res = await api.post("/auth/login", {
      email,
      password,
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Error al iniciar sesión");
    }

    const token = res.data.data.token;
    const usuario = res.data.data.usuario;

    // GUARDAR TOKEN Y USUARIO
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));

    return usuario;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  fetchMe: async () => {
    const res = await api.get("/auth/me");
    if (res?.data?.success) {
      const usuario = res.data.data;
      localStorage.setItem("user", JSON.stringify(usuario));
      return usuario;
    }
    throw new Error("No se pudo validar la sesión");
  },

  ensureAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const user = await authService.fetchMe();
      return user;
    } catch (e) {
      authService.logout();
      return null;
    }
  },

  hasRole: (allowed = []) => {
    const user = authService.getUser();
    if (!user) return false;
    if (!Array.isArray(allowed) || allowed.length === 0) return true;
    return allowed.includes(user.tipo);
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return token !== null && token !== undefined && token !== "";
  },
};

export default authService;
