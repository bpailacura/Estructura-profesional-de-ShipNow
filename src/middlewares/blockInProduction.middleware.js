/**
 * src/middlewares/blockInProduction.middleware.js
 *
 * Criterio aplicado sobre los endpoints internos (mocks, logger/test,
 * Swagger docs): en producción quedan bloqueados. Son herramientas de
 * desarrollo/QA -- generan datos falsos, escriben logs de prueba, o
 * exponen la forma completa de la API -- y no tienen ningún motivo de
 * negocio para estar accesibles frente a usuarios reales.
 *
 * Devuelve el mismo 404 genérico que cualquier ruta inexistente
 * (NOT_FOUND), en vez de un 403: en producción, ni siquiera confirmamos
 * que la ruta existe.
 */

const config = require('../config/env.config');
const { NotFoundError } = require('../errors/domainErrors');

function blockInProduction(req, res, next) {
  if (config.isProduction) {
    return next(new NotFoundError('NOT_FOUND'));
  }
  return next();
}

module.exports = blockInProduction;
