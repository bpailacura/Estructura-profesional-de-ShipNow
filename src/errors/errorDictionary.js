/**
 * src/errors/errorDictionary.js
 *
 * Diccionario centralizado de errores del dominio.
 * Cada entrada define el statusCode HTTP y el mensaje por defecto
 * que corresponde a ese tipo de error.
 *
 * Los errores personalizados (ver domainErrors.js) referencian estas
 * claves para no repetir "statusCode + mensaje" en cada service.
 */

const ERROR_DICTIONARY = Object.freeze({
  // --- Usuarios ---
  USER_NOT_FOUND: { statusCode: 404, message: 'Usuario no encontrado' },
  USER_ALREADY_EXISTS: { statusCode: 409, message: 'Ya existe un usuario con ese email' },

  // --- Productos ---
  PRODUCT_NOT_FOUND: { statusCode: 404, message: 'Producto no encontrado' },

  // --- Pedidos ---
  ORDER_NOT_FOUND: { statusCode: 404, message: 'Pedido no encontrado' },
  INVALID_ORDER_STATUS: { statusCode: 400, message: 'Estado de pedido inválido' },

  // --- Entregas ---
  DELIVERY_NOT_FOUND: { statusCode: 404, message: 'Entrega no encontrada' },
  INVALID_DELIVERY_STATUS: { statusCode: 400, message: 'Estado de entrega inválido' },
  DELIVERY_ALREADY_EXISTS: { statusCode: 409, message: 'El pedido ya tiene una entrega asociada' },

  // --- Mocks ---
  INVALID_MOCK_COUNT: { statusCode: 400, message: 'Cantidad de datos de prueba inválida' },
  MOCK_SEED_FAILURE: { statusCode: 502, message: 'Ocurrió un error al cargar los datos de prueba en la base' },

  // --- Genéricos ---
  VALIDATION_ERROR: { statusCode: 400, message: 'Los datos enviados no son válidos' },
  DUPLICATE_KEY: { statusCode: 409, message: 'Ya existe un registro con ese valor único' },
  NOT_FOUND: { statusCode: 404, message: 'Recurso no encontrado' },
  INTERNAL_ERROR: { statusCode: 500, message: 'Error interno del servidor' },
});

module.exports = ERROR_DICTIONARY;
