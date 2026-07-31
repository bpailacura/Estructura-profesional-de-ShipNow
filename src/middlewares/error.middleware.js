const { AppError } = require('../errors/domainErrors');

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

  // Log completo del lado del server (siempre), stack solo si es un 500
  console.error(`[Error] ${req.method} ${req.originalUrl} -> [${normalized.code}] ${normalized.message}`);
  if (normalized.statusCode >= 500) {
    console.error(err.stack);
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
