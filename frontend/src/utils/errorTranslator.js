/**
 * Traduce mensajes de error técnicos de PostgreSQL y Laravel a mensajes amigables
 * @param {string|object} error - El error del servidor
 * @returns {string} Mensaje de error traducido y amigable
 */
export function translateError(error) {
  const message = typeof error === 'string' ? error : error?.message || '';
  const messageStr = message.toLowerCase();

  // Errores de PostgreSQL - Restricciones de integridad
  if (messageStr.includes('unique constraint')) {
    if (messageStr.includes('codigo_principal')) return 'Este código principal ya existe. Por favor, use otro código.';
    if (messageStr.includes('codigo_barras')) return 'Este código de barras ya existe. Por favor, use otro código.';
    if (messageStr.includes('nombre')) return 'Este nombre ya existe. Por favor, use otro nombre.';
    if (messageStr.includes('ruc')) return 'Este RUC ya está registrado.';
    if (messageStr.includes('cedula')) return 'Esta cédula ya está registrada.';
    if (messageStr.includes('email')) return 'Este correo electrónico ya está registrado.';
    return 'Este valor ya existe en el sistema. Por favor, intente con otro.';
  }

  // Errores de clave foránea (Foreign Key)
  if (messageStr.includes('foreign key constraint')) {
    if (messageStr.includes('categoria')) return 'No se puede eliminar esta categoría porque tiene productos asociados.';
    if (messageStr.includes('cliente')) return 'No se puede eliminar este cliente porque tiene compras asociadas.';
    if (messageStr.includes('proveedor')) return 'No se puede eliminar este proveedor porque tiene compras asociadas.';
    if (messageStr.includes('sucursal')) return 'No se puede eliminar esta sucursal porque tiene movimientos asociados.';
    return 'No se puede eliminar este registro porque está siendo utilizado en otras transacciones.';
  }

  // Errores de campos requeridos/NOT NULL
  if (messageStr.includes('not null constraint') || messageStr.includes('null')) {
    if (messageStr.includes('nombre')) return 'El nombre es obligatorio.';
    if (messageStr.includes('precio')) return 'El precio es obligatorio.';
    if (messageStr.includes('codigo')) return 'El código es obligatorio.';
    if (messageStr.includes('stock')) return 'El stock es obligatorio.';
    return 'Faltan campos obligatorios para completar la operación.';
  }

  // Errores de tipo de dato (validation)
  if (messageStr.includes('invalid') || messageStr.includes('malformed')) {
    if (messageStr.includes('decimal') || messageStr.includes('numeric')) return 'Por favor, ingrese un número válido.';
    if (messageStr.includes('date')) return 'Por favor, ingrese una fecha válida.';
    if (messageStr.includes('integer')) return 'Por favor, ingrese un número entero válido.';
    return 'El formato de los datos ingresados no es válido.';
  }

  // Errores de límites/rango - Check constraints de PostgreSQL
  if (messageStr.includes('violates') || messageStr.includes('check constraint')) {
    if (messageStr.includes('stock')) return 'La cantidad de stock debe ser mayor o igual a cero.';
    if (messageStr.includes('precio')) return 'El precio debe ser mayor que cero.';
    if (messageStr.includes('iva|ice')) return 'Los valores de IVA e ICE deben ser válidos.';
    return 'Los valores ingresados no cumplen con los requisitos del sistema.';
  }

  // Errores de validación de Laravel - Campos numéricos mínimos
  if (messageStr.includes('must be at least')) {
    if (messageStr.includes('precio_costo')) return 'El precio de costo debe ser al menos 0.';
    if (messageStr.includes('precio_unitario') || messageStr.includes('precio venta')) return 'El precio de venta debe ser al menos 0.';
    if (messageStr.includes('stock')) return 'El stock debe ser al menos 0.';
    if (messageStr.includes('cantidad')) return 'La cantidad debe ser al menos 0.';
    return 'El valor ingresado es demasiado pequeño.';
  }

  // Errores de validación de Laravel - Números negativos
  if (messageStr.includes('must be at least 0') || messageStr.includes('negative')) {
    if (messageStr.includes('precio')) return 'El precio no puede ser negativo. Por favor, ingrese un valor mayor o igual a 0.';
    if (messageStr.includes('stock') || messageStr.includes('cantidad')) return 'La cantidad no puede ser negativa. Por favor, ingrese un valor mayor o igual a 0.';
    return 'Este campo no puede contener valores negativos.';
  }

  // Errores de validación de Laravel - Números muy grandes
  if (messageStr.includes('must not be greater than') || messageStr.includes('exceeds maximum') || messageStr.includes('debe ser menor')) {
    if (messageStr.includes('precio_costo') || (messageStr.includes('precio') && messageStr.includes('999999'))) return 'El precio de costo no puede ser mayor a 999,999.99.';
    if (messageStr.includes('precio_unitario') || messageStr.includes('precio venta') || messageStr.includes('precio') && messageStr.includes('999999')) return 'El precio de venta no puede ser mayor a 999,999.99.';
    if (messageStr.includes('stock') || messageStr.includes('cantidad') && messageStr.includes('999999')) return 'La cantidad no puede ser mayor a 999,999.';
    if (messageStr.includes('iva') || messageStr.includes('ice')) return 'El porcentaje es demasiado grande. Debe ser entre 0 y 100.';
    if (messageStr.includes('debe ser menor') || messageStr.includes('debe ser menor o igual')) {
      // Extraer el valor máximo permitido del mensaje
      const match = messageStr.match(/(\d+(?:[.,]\d{1,2})?)/g);
      if (match && match.length > 0) {
        const maxValue = match[match.length - 1];
        return `El valor ingresado es demasiado grande. El máximo permitido es ${maxValue}.`;
      }
      return 'El valor ingresado es demasiado grande.';
    }
    return 'El valor ingresado excede el máximo permitido.';
  }

  // Errores de tipo numérico en Laravel
  if (messageStr.includes('must be a number') || messageStr.includes('must be numeric')) {
    return 'Por favor, ingrese solo números en este campo.';
  }

  // Errores de formato decimal
  if (messageStr.includes('must be numeric') || messageStr.includes('must be integer')) {
    return 'Por favor, ingrese un número válido en este campo.';
  }

  // Errores de validación con límites específicos (ya traducidos desde el backend)
  if (messageStr.includes('debe ser menor') || messageStr.includes('debe ser mayor') || messageStr.includes('debe estar entre')) {
    // El backend ya envió un mensaje traducido, solo normalizarlo
    return message;
  }

  // Errores de conexión
  if (messageStr.includes('connection refused') || messageStr.includes('econnrefused')) {
    return 'No se pudo conectar con el servidor. Por favor, intente más tarde.';
  }

  // Errores de timeout
  if (messageStr.includes('timeout') || messageStr.includes('timed out')) {
    return 'La solicitud tardó demasiado tiempo. Por favor, intente nuevamente.';
  }

  // Errores de autenticación/autorización
  if (messageStr.includes('unauthorized') || messageStr.includes('forbidden')) {
    return 'No tiene permiso para realizar esta acción.';
  }

  // Errores de recurso no encontrado
  if (messageStr.includes('not found') || messageStr.includes('no existe')) {
    return 'El registro solicitado no existe o fue eliminado.';
  }

  // Errores genéricos de validación del cliente
  if (messageStr.includes('validation failed')) {
    return 'Por favor, verifique los datos ingresados.';
  }

  // Cedula ecuatoriana inválida
  if (messageStr.includes('cedula') || messageStr.includes('cédula')) {
    if (messageStr.includes('invalid') || messageStr.includes('invalida')) {
      return 'La cédula ingresada no es válida. Por favor, verifique.';
    }
    if (messageStr.includes('ecuatoriana')) {
      return 'Por favor, ingrese una cédula ecuatoriana válida.';
    }
  }

  // RUC ecuatoriano inválido
  if (messageStr.includes('ruc')) {
    if (messageStr.includes('invalid') || messageStr.includes('invalido')) {
      return 'El RUC ingresado no es válido. Por favor, verifique.';
    }
    if (messageStr.includes('ecuatoriano')) {
      return 'Por favor, ingrese un RUC ecuatoriano válido.';
    }
  }

  // Teléfono inválido
  if (messageStr.includes('telefono') || messageStr.includes('phone')) {
    if (messageStr.includes('invalid') || messageStr.includes('invalido')) {
      return 'El número de teléfono no es válido. Por favor, verifique.';
    }
  }

  // Si el mensaje original es amigable, devolverlo
  if (message && message.length > 0 && !messageStr.includes('error code') && !messageStr.includes('sql')) {
    return message;
  }

  // Mensaje por defecto
  return 'Ocurrió un error al procesar la solicitud. Por favor, intente nuevamente.';
}

/**
 * Obtiene el mensaje de error de una respuesta HTTP
 * @param {object} errorResponse - El objeto de error de la respuesta
 * @returns {string} Mensaje traducido
 */
export function getErrorMessage(errorResponse) {
  if (!errorResponse) {
    return 'Ocurrió un error desconocido.';
  }

  // Si hay un campo 'error' específico del backend (ej: { message: "...", error: "detalle" })
  if (errorResponse.response?.data?.error) {
    return translateError(errorResponse.response.data.error);
  }

  // Si es un objeto de error de axios/fetch
  if (errorResponse.response?.data?.message) {
    return translateError(errorResponse.response.data.message);
  }

  // Si hay errores de validación de Laravel (con objeto errors)
  if (errorResponse.response?.data?.errors && typeof errorResponse.response.data.errors === 'object') {
    const errors = errorResponse.response.data.errors;
    const errorMessages = [];
    
    // Recopilar todos los mensajes de error traducidos
    for (const [field, fieldErrors] of Object.entries(errors)) {
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        // Traducir el primer error de cada campo
        const translatedError = translateError(fieldErrors[0]);
        errorMessages.push(translatedError);
      }
    }
    
    // Retornar el primer error o todos si hay menos de 3
    if (errorMessages.length > 0) {
      return errorMessages.length === 1 
        ? errorMessages[0] 
        : errorMessages.slice(0, 2).join(' ');
    }
  }

  // Si es un objeto con mensaje directo
  if (errorResponse.message) {
    return translateError(errorResponse.message);
  }

  // Si es un string
  if (typeof errorResponse === 'string') {
    return translateError(errorResponse);
  }

  return 'Ocurrió un error al procesar la solicitud. Por favor, intente nuevamente.';
}
