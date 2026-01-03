import api from "./api";

/**
 * Servicio para gestionar egresos/desecho de productos
 */

/**
 * Obtener todos los egresos con filtros opcionales
 * @param {Object} params - Parámetros de filtrado
 * @param {string} params.motivo - Filtrar por motivo
 * @param {string} params.fecha_inicio - Fecha inicial
 * @param {string} params.fecha_fin - Fecha final
 * @param {string} params.search - Búsqueda general
 */
export const getEgresos = async (params = {}) => {
  const response = await api.get("/egresos", { params });
  return response.data;
};

/**
 * Obtener estadísticas de egresos
 */
export const getEstadisticasEgresos = async () => {
  const response = await api.get("/egresos/estadisticas");
  return response.data;
};

/**
 * Obtener productos problemáticos (stock bajo, sin stock)
 */
export const getProductosProblematicos = async () => {
  const response = await api.get("/egresos/productos-problematicos");
  return response.data;
};

/**
 * Obtener un egreso por ID
 * @param {number} id - ID del egreso
 */
export const getEgresoById = async (id) => {
  const response = await api.get(`/egresos/${id}`);
  return response.data;
};

/**
 * Crear un nuevo egreso
 * @param {Object} data - Datos del egreso
 * @param {string} data.fecha - Fecha del egreso
 * @param {string} data.motivo - Motivo del egreso
 * @param {string} data.observaciones - Observaciones adicionales
 * @param {Array} data.detalles - Array de productos a egresar
 */
export const createEgreso = async (data) => {
  const response = await api.post("/egresos", data);
  return response.data;
};

/**
 * Eliminar un egreso (revierte el stock)
 * @param {number} id - ID del egreso a eliminar
 */
export const deleteEgreso = async (id) => {
  const response = await api.delete(`/egresos/${id}`);
  return response.data;
};

/**
 * Constantes de motivos de egreso
 */
export const MOTIVOS_EGRESO = {
  desecho: { label: "Desecho", color: "bg-gray-500", icon: "FaTrash" },
  vencido: { label: "Producto Vencido", color: "bg-orange-500", icon: "FaCalendarTimes" },
  dañado: { label: "Producto Dañado", color: "bg-red-500", icon: "FaExclamationTriangle" },
  perdida: { label: "Pérdida/Robo", color: "bg-purple-500", icon: "FaUserSecret" },
  ajuste: { label: "Ajuste de Inventario", color: "bg-blue-500", icon: "FaBalanceScale" },
  otro: { label: "Otro", color: "bg-gray-400", icon: "FaQuestionCircle" },
};

export default {
  getEgresos,
  getEstadisticasEgresos,
  getProductosProblematicos,
  getEgresoById,
  createEgreso,
  deleteEgreso,
  MOTIVOS_EGRESO,
};
