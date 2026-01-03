import api from './api';

// Constantes de formas de pago
export const FORMAS_PAGO = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia Bancaria',
    cheque: 'Cheque',
    credito: 'Crédito',
};

// Constantes de estados de factura
export const ESTADOS_FACTURA = {
    pendiente: 'Pendiente',
    emitida: 'Emitida',
    pagada: 'Pagada',
    anulada: 'Anulada',
};

// Colores para los estados
export const ESTADO_COLORS = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    emitida: 'bg-blue-100 text-blue-800',
    pagada: 'bg-green-100 text-green-800',
    anulada: 'bg-red-100 text-red-800',
};

// Cédula de consumidor final
export const CONSUMIDOR_FINAL_CEDULA = '9999999999999';
export const CONSUMIDOR_FINAL_NOMBRE = 'CONSUMIDOR FINAL';

/**
 * Obtener lista de facturas con filtros
 * @param {Object} params - Parámetros de filtro
 * @returns {Promise<Array>} Lista de facturas
 */
export const getFacturas = async (params = {}) => {
    const response = await api.get('/facturas', { params });
    return response.data;
};

/**
 * Obtener estadísticas de facturación
 * @returns {Promise<Object>} Estadísticas
 */
export const getEstadisticas = async () => {
    const response = await api.get('/facturas/estadisticas');
    return response.data;
};

/**
 * Obtener una factura por ID
 * @param {number} id - ID de la factura
 * @returns {Promise<Object>} Factura
 */
export const getFactura = async (id) => {
    const response = await api.get(`/facturas/${id}`);
    return response.data;
};

/**
 * Crear nueva factura
 * @param {Object} data - Datos de la factura
 * @returns {Promise<Object>} Factura creada
 */
export const createFactura = async (data) => {
    const response = await api.post('/facturas', data);
    return response.data;
};

/**
 * Actualizar factura (estado/observaciones)
 * @param {number} id - ID de la factura
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Factura actualizada
 */
export const updateFactura = async (id, data) => {
    const response = await api.put(`/facturas/${id}`, data);
    return response.data;
};

/**
 * Eliminar factura (solo si está pendiente)
 * @param {number} id - ID de la factura
 * @returns {Promise<Object>} Respuesta
 */
export const deleteFactura = async (id) => {
    const response = await api.delete(`/facturas/${id}`);
    return response.data;
};

/**
 * Buscar clientes
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} Lista de clientes
 */
export const buscarClientes = async (query) => {
    const response = await api.get('/facturas/clientes', { params: { q: query } });
    return response.data;
};

/**
 * Obtener IVA configurado
 * @returns {Promise<number>} Porcentaje de IVA
 */
export const getIVA = async () => {
    const response = await api.get('/config/iva');
    return response.data.iva_porcentaje || 15;
};

/**
 * Obtener lista de productos
 * @returns {Promise<Array>} Lista de productos
 */
export const getProductos = async () => {
    const response = await api.get('/productos');
    return response.data;
};

/**
 * Validar cédula ecuatoriana
 * @param {string} cedula - Número de cédula
 * @returns {boolean} true si es válida
 */
export const validarCedula = (cedula) => {
    if (!cedula || cedula.length !== 10) return false;
    
    // Consumidor final corto
    if (cedula === '9999999999') return true;
    
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    
    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if (tercerDigito > 5) return false;
    
    // Algoritmo módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
        let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
        if (valor > 9) valor -= 9;
        suma += valor;
    }
    
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(cedula.charAt(9), 10);
};

/**
 * Validar RUC ecuatoriano
 * @param {string} ruc - Número de RUC
 * @returns {boolean} true si es válido
 */
export const validarRuc = (ruc) => {
    if (!ruc || ruc.length !== 13) return false;
    
    // Consumidor final largo
    if (ruc === '9999999999999') return true;
    
    // Los últimos 3 dígitos deben ser 001
    if (!ruc.endsWith('001')) return false;
    
    const cedula = ruc.substring(0, 10);
    
    // Validar tercerDigito para tipo de contribuyente
    const tercerDigito = parseInt(ruc.charAt(2), 10);
    
    // Persona natural (0-5)
    if (tercerDigito <= 5) {
        return validarCedula(cedula);
    }
    
    // Sector público (6)
    if (tercerDigito === 6) {
        const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        for (let i = 0; i < 8; i++) {
            suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
        }
        const residuo = suma % 11;
        const verificador = residuo === 0 ? 0 : 11 - residuo;
        return verificador === parseInt(ruc.charAt(8), 10);
    }
    
    // Sociedad (9)
    if (tercerDigito === 9) {
        const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;
        for (let i = 0; i < 9; i++) {
            suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
        }
        const residuo = suma % 11;
        const verificador = residuo === 0 ? 0 : 11 - residuo;
        return verificador === parseInt(ruc.charAt(9), 10);
    }
    
    return false;
};

/**
 * Validar cédula o RUC ecuatoriano
 * @param {string} documento - Cédula o RUC
 * @returns {Object} { valid, type, message }
 */
export const validarDocumento = (documento) => {
    if (!documento) {
        return { valid: false, type: null, message: 'Ingrese un documento' };
    }
    
    // Consumidor final
    if (documento === '9999999999' || documento === '9999999999999') {
        return { valid: true, type: 'consumidor_final', message: 'Consumidor Final' };
    }
    
    if (documento.length === 10) {
        if (validarCedula(documento)) {
            return { valid: true, type: 'cedula', message: 'Cédula válida' };
        }
        return { valid: false, type: 'cedula', message: 'Cédula inválida' };
    }
    
    if (documento.length === 13) {
        if (validarRuc(documento)) {
            return { valid: true, type: 'ruc', message: 'RUC válido' };
        }
        return { valid: false, type: 'ruc', message: 'RUC inválido' };
    }
    
    return { valid: false, type: null, message: 'Documento debe tener 10 (cédula) o 13 (RUC) dígitos' };
};

/**
 * Formatear precio a moneda ecuatoriana
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value || 0);
};

/**
 * Formatear fecha
 * @param {string} date - Fecha ISO
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

/**
 * Formatear fecha y hora
 * @param {string} date - Fecha ISO
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default {
    getFacturas,
    getEstadisticas,
    getFactura,
    createFactura,
    updateFactura,
    deleteFactura,
    buscarClientes,
    getIVA,
    getProductos,
    validarCedula,
    validarRuc,
    validarDocumento,
    formatCurrency,
    formatDate,
    formatDateTime,
    FORMAS_PAGO,
    ESTADOS_FACTURA,
    ESTADO_COLORS,
    CONSUMIDOR_FINAL_CEDULA,
    CONSUMIDOR_FINAL_NOMBRE,
};
