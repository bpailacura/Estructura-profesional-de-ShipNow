const { ValidationError } = require('../errors/domainErrors');

/**
 * Valida que `value` sea un entero dentro de [min, max].
 * A diferencia de un "clamp" silencioso, acá cualquier cantidad inválida
 * (no numérica, negativa, decimal, o fuera de rango) corta la ejecución
 * con un error controlado y explica qué estuvo mal.
 */
function parseCount(value, { min, max, fieldName = 'count' } = {}) {
  if (value === undefined || value === null || value === '') {
    return min; // valor por defecto razonable cuando no se manda el parámetro
  }

  const num = Number(value);

  if (!Number.isFinite(num)) {
    throw new ValidationError('INVALID_MOCK_COUNT', {
      message: `El campo "${fieldName}" debe ser un número`,
      details: { field: fieldName, received: value },
    });
  }

  if (!Number.isInteger(num)) {
    throw new ValidationError('INVALID_MOCK_COUNT', {
      message: `El campo "${fieldName}" debe ser un número entero`,
      details: { field: fieldName, received: value },
    });
  }

  if (num < min || num > max) {
    throw new ValidationError('INVALID_MOCK_COUNT', {
      message: `El campo "${fieldName}" debe estar entre ${min} y ${max}`,
      details: { field: fieldName, received: value, min, max },
    });
  }

  return num;
}

module.exports = { parseCount };
