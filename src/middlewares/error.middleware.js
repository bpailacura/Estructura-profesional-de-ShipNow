const { AppError } = require('../errors/domainErrors');
const logger = require('../config/logger.config');

/**
 * Convierte cualquier error (uno nuestro, o uno de Mongoose/Mongo, o uno
 * inesperado) en una instancia de AppError, para que el response final
 * sea siempre uniforme sin importar de dónde vino el error.
 */
function normalizeError(err) {
  if (err instanceof AppError) {
    return err;
  }

  // Mongoose: id con formato inválido (ej: GET /api/products/abc123)
  if (err.name === 'CastError') {
    return new AppError('VALIDATION_ERROR', {
      message: `El identificador "${err.value}" no tiene un formato válido`,
      details: { field: err.path },
    });
  }

  // Mongoose: falla de validación de schema (ej: insertMany del módulo de mocks)
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((fieldError) => fieldError.message);
    return new AppError('VALIDATION_ERROR', {
      message: 'Los datos no cumplen con el esquema esperado',
      details,
    });
  }

  // Mongo: clave duplicada (ej: email único)
  if (err.code === 11000) {
    return new AppError('DUPLICATE_KEY', { details: err.keyValue });
  }

  // Cualquier otra cosa: error inesperado, no lo mostramos tal cual al cliente
  return new AppError('INTERNAL_ERROR', { message: err.message });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const logMessage = `${req.method} ${req.originalUrl} -> [${normalized.code}] ${normalized.message}`;

  // Errores esperados/de negocio (4xx: validación, no encontrado, conflicto)
  // se registran como advertencia. Errores inesperados del servidor (5xx)
  // se registran como error, con el stack completo para poder investigarlos.
  if (normalized.statusCode >= 500) {
    logger.error(logMessage);
    if (err.stack) {
      logger.error(err.stack);
    }
  } else {
    logger.warning(logMessage);
  }

  res.status(normalized.statusCode).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  });
}

module.exports = errorHandler;
