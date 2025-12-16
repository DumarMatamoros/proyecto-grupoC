/**
 * Constantes y límites del sistema de acuerdo a las validaciones del backend
 */

// Límites de campos numéricos para productos
export const PRODUCT_LIMITS = {
  // Códigos
  codigo_principal: {
    max: 100,
    label: 'Código Principal'
  },
  codigo_barras: {
    max: 100,
    label: 'Código de Barras'
  },
  
  // Textos
  nombre: {
    max: 500,
    label: 'Nombre'
  },
  descripcion: {
    max: 2000,
    label: 'Descripción'
  },
  
  // Números - Precios (sin máximo explícito, pero limitamos a valores realistas)
  precio_costo: {
    min: 0,
    max: 999999.99,
    step: 0.01,
    label: 'Precio de Costo'
  },
  precio_unitario: {
    min: 0,
    max: 999999.99,
    step: 0.01,
    label: 'Precio de Venta'
  },
  
  // Stock
  stock_actual: {
    min: 0,
    max: 999999,
    step: 1,
    label: 'Stock'
  },
  
  // Imagen
  imagen: {
    maxSize: 4096, // KB
    maxSizeMB: 4,
    label: 'Imagen'
  }
};

// Límites de campos de categoría
export const CATEGORY_LIMITS = {
  nombre: {
    max: 255,
    label: 'Nombre'
  },
  descripcion: {
    max: 500,
    label: 'Descripción'
  }
};

// Límites de campos de cliente/proveedor
export const PERSON_LIMITS = {
  nombre: {
    max: 255,
    label: 'Nombre'
  },
  email: {
    max: 255,
    label: 'Email'
  },
  razon_social: {
    max: 255,
    label: 'Razón Social'
  },
  direccion: {
    max: 500,
    label: 'Dirección'
  },
  telefono: {
    max: 20,
    label: 'Teléfono'
  }
};

// Mensajes de validación por tipo de campo
export const VALIDATION_MESSAGES = {
  numeric: (field, min, max) => {
    if (min !== undefined && max !== undefined) {
      return `${field} debe estar entre ${min} y ${max}.`;
    } else if (min !== undefined) {
      return `${field} debe ser mayor o igual a ${min}.`;
    } else if (max !== undefined) {
      return `${field} no puede exceder ${max}.`;
    }
    return `${field} debe ser un número válido.`;
  },
  
  string: (field, maxLength) => {
    if (maxLength) {
      return `${field} no puede exceder ${maxLength} caracteres.`;
    }
    return `${field} debe ser un texto válido.`;
  },
  
  required: (field) => {
    return `${field} es obligatorio.`;
  },
  
  fileSize: (field, maxMB) => {
    return `${field} no puede exceder ${maxMB}MB.`;
  }
};

// Exportar función para obtener errores de validación del lado del cliente
export function validateProductField(fieldName, value) {
  const limit = PRODUCT_LIMITS[fieldName];
  
  if (!limit) return null;
  
  if (limit.max && value.toString().length > limit.max) {
    return VALIDATION_MESSAGES.string(limit.label, limit.max);
  }
  
  if (limit.min !== undefined && typeof value === 'number' && value < limit.min) {
    return VALIDATION_MESSAGES.numeric(limit.label, limit.min, limit.max);
  }
  
  if (limit.max && typeof value === 'number' && value > limit.max) {
    return VALIDATION_MESSAGES.numeric(limit.label, limit.min, limit.max);
  }
  
  return null;
}

export function validateCategoryField(fieldName, value) {
  const limit = CATEGORY_LIMITS[fieldName];
  
  if (!limit) return null;
  
  if (limit.max && value.toString().length > limit.max) {
    return VALIDATION_MESSAGES.string(limit.label, limit.max);
  }
  
  return null;
}
