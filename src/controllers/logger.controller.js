const logger = require('../config/logger.config');

/**
 * Endpoint interno, no representa funcionalidad de negocio. Sirve para
 * verificar rápidamente que el logger está bien configurado: dispara un
 * mensaje en cada nivel y permite chequear que aparecen donde corresponde
 * (consola, logs/combined-*.log y logs/error-*.log).
 */
class LoggerController {
  test(req, res) {
    logger.debug('Log de prueba — nivel debug: detalle interno de diagnóstico');
    logger.http(`Log de prueba — nivel http: ${req.method} ${req.originalUrl}`);
    logger.info('Log de prueba — nivel info: evento informativo normal');
    logger.warning('Log de prueba — nivel warning: situación esperada pero a atender');
    logger.error('Log de prueba — nivel error: fallo inesperado del servidor');
    logger.fatal('Log de prueba — nivel fatal: falla crítica de la aplicación');

    return res.status(200).json({
      message:
        'Se generaron logs de prueba en los 6 niveles (debug, http, info, warning, error, fatal). Revisá la consola y la carpeta /logs.',
    });
  }
}

module.exports = new LoggerController();
