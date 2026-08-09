const AppError = require('./AppError');

/**
 * Errores personalizados del dominio, agrupados por "familia".
 * Todos heredan de AppError, así que el middleware global los reconoce
 * a todos de la misma forma (instanceof AppError), sin necesitar un
 * catch por cada tipo.
 *
 * `code` debe ser una clave existente en errorDictionary.js.
 */

// 404 — el recurso pedido no existe (usuario, producto, pedido, etc.)
class NotFoundError extends AppError {
  constructor(code = 'NOT_FOUND', options) {
    super(code, options);
  }
}

// 400 — los datos recibidos no cumplen las reglas de validación
class ValidationError extends AppError {
  constructor(code = 'VALIDATION_ERROR', options) {
    super(code, options);
  }
}

// 409 — conflicto con el estado actual de los datos (duplicados, estado inválido para la operación)
class ConflictError extends AppError {
  constructor(code, options) {
    super(code, options);
  }
}

// 502 — algo falló al interactuar con la base de datos (ej: durante el seed de mocks)
class DatabaseError extends AppError {
  constructor(code = 'MOCK_SEED_FAILURE', options) {
    super(code, options);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  DatabaseError,
};
