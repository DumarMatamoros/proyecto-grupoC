import api from './api';

/**
 * Servicio para manejar descargas de archivos desde el backend
 */

/**
 * Descarga un archivo blob desde una URL
 * @param {string} url - URL del endpoint
 * @param {object} params - Parámetros de la petición
 * @param {string} defaultFilename - Nombre por defecto si no viene en headers
 * @returns {Promise<void>}
 */
const downloadBlob = async (url, params = {}, defaultFilename = 'download') => {
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob',
    });

    // Extraer nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Crear URL temporal para el blob y descargar
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return { success: true, filename };
  } catch (error) {
    console.error('Error descargando archivo:', error);
    throw error;
  }
};

/**
 * Obtiene un blob desde una URL y retorna una URL de objeto para preview
 * @param {string} url - URL del endpoint
 * @param {object} params - Parámetros de la petición
 * @returns {Promise<string>} URL del objeto blob
 */
export const fetchBlobUrl = async (url, params = {}) => {
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error obteniendo blob:', error);
    throw error;
  }
};

/**
 * Obtiene la URL del blob para previsualizar un ticket
 * @param {number|string} saleId - ID de la venta
 * @returns {Promise<string>} URL del objeto blob
 */
export const getTicketBlobUrl = async (saleId) => {
  return fetchBlobUrl(`/sales/${saleId}/ticket`, { format: 'pdf' });
};

/**
 * Obtiene la URL del blob para previsualizar una factura
 * @param {number|string} saleId - ID de la venta
 * @returns {Promise<string>} URL del objeto blob
 */
export const getInvoiceBlobUrl = async (saleId) => {
  return fetchBlobUrl(`/sales/${saleId}/invoice`, { format: 'pdf' });
};

/**
 * Exporta las ventas a Excel (CSV o XLSX)
 * @param {object} filters - Filtros de búsqueda
 * @param {string} filters.fecha_inicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} filters.fecha_fin - Fecha fin (YYYY-MM-DD)
 * @param {string} filters.search - Búsqueda por texto
 * @param {string} filters.estado - Estado de la factura
 * @param {string} filters.forma_pago - Forma de pago
 * @param {string} format - Formato: 'csv' o 'excel' (default: 'excel')
 * @returns {Promise<void>}
 */
export const downloadSalesExcel = async (filters = {}, format = 'excel') => {
  const extension = format === 'csv' ? 'csv' : 'xls';
  const defaultFilename = `ventas_${new Date().toISOString().split('T')[0]}.${extension}`;
  
  return downloadBlob('/sales/export/excel', { ...filters, format }, defaultFilename);
};

/**
 * Exporta las ventas a PDF
 * @param {object} filters - Filtros de búsqueda
 * @returns {Promise<void>}
 */
export const downloadSalesPdf = async (filters = {}) => {
  const defaultFilename = `ventas_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return downloadBlob('/sales/export/pdf', filters, defaultFilename);
};

/**
 * Descarga el reporte diario
 * @param {string} fecha - Fecha del reporte (YYYY-MM-DD)
 * @param {string} format - Formato: 'pdf' o 'html'
 * @returns {Promise<void>}
 */
export const downloadDailyReport = async (fecha = null, format = 'pdf') => {
  const reportDate = fecha || new Date().toISOString().split('T')[0];
  const defaultFilename = `reporte_diario_${reportDate}.pdf`;
  
  return downloadBlob('/sales/report/daily', { fecha, format }, defaultFilename);
};

/**
 * Descarga el ticket de una venta
 * @param {number|string} saleId - ID de la venta
 * @returns {Promise<void>}
 */
export const downloadTicket = async (saleId) => {
  const defaultFilename = `ticket_${saleId}.pdf`;
  
  return downloadBlob(`/sales/${saleId}/ticket`, { format: 'pdf' }, defaultFilename);
};

/**
 * Descarga la factura formal de una venta
 * @param {number|string} saleId - ID de la venta
 * @returns {Promise<void>}
 */
export const downloadInvoice = async (saleId) => {
  const defaultFilename = `factura_${saleId}.pdf`;
  
  return downloadBlob(`/sales/${saleId}/invoice`, { format: 'pdf' }, defaultFilename);
};

/**
 * Libera una URL de objeto blob creada previamente
 * @param {string} blobUrl - URL del objeto blob
 */
export const revokeBlobUrl = (blobUrl) => {
  if (blobUrl && blobUrl.startsWith('blob:')) {
    window.URL.revokeObjectURL(blobUrl);
  }
};

export default {
  downloadSalesExcel,
  downloadSalesPdf,
  downloadDailyReport,
  downloadTicket,
  downloadInvoice,
  fetchBlobUrl,
  getTicketBlobUrl,
  getInvoiceBlobUrl,
  revokeBlobUrl,
};
