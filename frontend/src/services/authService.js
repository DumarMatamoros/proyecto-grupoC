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
    const mustChangePassword = res.data.data.must_change_password || false;

    // GUARDAR TOKEN Y USUARIO
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));
    
    // Guardar flag de cambio de contraseña
    if (mustChangePassword) {
      localStorage.setItem("must_change_password", "true");
    } else {
      localStorage.removeItem("must_change_password");
    }

    return { usuario, mustChangePassword };
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("must_change_password");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  mustChangePassword: () => {
    return localStorage.getItem("must_change_password") === "true";
  },

  clearMustChangePassword: () => {
    localStorage.removeItem("must_change_password");
  },

  fetchMe: async () => {
    const res = await api.get("/auth/me");
    if (res?.data?.success) {
      const usuario = res.data.data;
      localStorage.setItem("user", JSON.stringify(usuario));
      
      // Actualizar flag de cambio de contraseña
      if (usuario.must_change_password) {
        localStorage.setItem("must_change_password", "true");
      } else {
        localStorage.removeItem("must_change_password");
      }
      
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
