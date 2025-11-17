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

  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return token !== null && token !== undefined && token !== "";
  },
};

export default authService;
