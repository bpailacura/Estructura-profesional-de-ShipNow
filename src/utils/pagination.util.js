/**
 * src/utils/pagination.util.js
 *
 * Utilidad compartida para paginar listados (products, users, orders,
 * deliveries). Centraliza el parseo de page/limit desde query string y
 * el cálculo de metadata, para no repetir esta lógica en cada Service.
 */

const { PAGINATION } = require('../constants');

// req.query siempre trae strings (o undefined). Acá se normaliza a
// números seguros, con defaults y un tope máximo (MAX_LIMIT).
function parsePagination({ page, limit } = {}) {
  let parsedPage = parseInt(page, 10);
  let parsedLimit = parseInt(limit, 10);

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    parsedPage = PAGINATION.DEFAULT_PAGE;
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    parsedLimit = PAGINATION.DEFAULT_LIMIT;
  }
  if (parsedLimit > PAGINATION.MAX_LIMIT) {
    parsedLimit = PAGINATION.MAX_LIMIT;
  }

  const skip = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, skip };
}

// Arma el objeto de metadata que viaja junto a "data" en la respuesta.
function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildMeta };
