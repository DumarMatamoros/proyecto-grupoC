import api from "./api";

/**
 * Servicio para gestionar configuraciones del sistema POS
 */
const settingsService = {
  /**
   * Obtener todas las configuraciones
   * @returns {Promise} - Configuraciones en formato flat y agrupado
   */
  getAll: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  /**
   * Actualizar múltiples configuraciones a la vez
   * @param {Object} settings - Objeto { clave: valor, ... }
   * @returns {Promise}
   */
  updateBulk: async (settings) => {
    const response = await api.put("/admin/settings", { settings });
    return response.data;
  },

  /**
   * Subir logo de empresa
   * @param {File} file - Archivo de imagen
   * @returns {Promise}
   */
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("logo", file);
    
    const response = await api.post("/admin/settings/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Eliminar logo de empresa
   * @returns {Promise}
   */
  deleteLogo: async () => {
    const response = await api.delete("/admin/settings/logo");
    return response.data;
  },

  /**
   * Obtener una configuración específica
   * @param {string} clave - Clave de la configuración
   * @returns {Promise}
   */
  get: async (clave) => {
    const response = await api.get(`/admin/configuraciones/${clave}`);
    return response.data;
  },

  /**
   * Actualizar una configuración individual
   * @param {string} clave - Clave de la configuración
   * @param {string} valor - Nuevo valor
   * @returns {Promise}
   */
  update: async (clave, valor) => {
    const response = await api.put(`/admin/configuraciones/${clave}`, { valor });
    return response.data;
  },
};

export default settingsService;
