/**
 * Middleware de errores centralizado.
 * Los services lanzan errores con `error.statusCode`; si no lo tienen,
 * asumimos 500 (error inesperado / interno).
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  console.error(`[Error] ${req.method} ${req.originalUrl} ->`, err.message);

  res.status(statusCode).json({
    error: {
      message: err.message || 'Error interno del servidor',
    },
  });
}

module.exports = errorHandler;
