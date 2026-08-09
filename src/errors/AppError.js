const ERROR_DICTIONARY = require('./errorDictionary');

/**
 * AppError
 * Clase base para todos los errores "esperados" del dominio.
 *
 * En vez de crear cada error con `new Error(...)` y setear `statusCode`
 * a mano, se instancia con una clave del diccionario (`code`), y de ahí
 * saca el statusCode y el mensaje por defecto. `message` y `details` son
 * opcionales, para casos donde se necesita más precisión que el mensaje
 * genérico del diccionario (ej: qué campo falló la validación).
 */
class AppError extends Error {
  constructor(code, { message, details = null } = {}) {
    const entry = ERROR_DICTIONARY[code] || ERROR_DICTIONARY.INTERNAL_ERROR;
    super(message || entry.message);

    this.name = this.constructor.name;
    this.code = ERROR_DICTIONARY[code] ? code : 'INTERNAL_ERROR';
    this.statusCode = entry.statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
