// tests/helpers/testData.js
//
// Fábricas simples de payloads y helpers para crear datos de prueba a
// través de la propia API (nunca insertando "a mano" contra Mongoose),
// para que los tests ejerciten el mismo camino que un cliente real.

let counter = 0;

/**
 * Devuelve un payload de registro de usuario válido. `overrides` permite
 * pisar cualquier campo puntual sin repetir el resto en cada test.
 */
function validUserPayload(overrides = {}) {
  counter += 1;
  return {
    name: `Usuario Test ${counter}`,
    email: `usuario.test.${counter}.${Date.now()}@shipnow.test`,
    password: 'Password123!',
    ...overrides,
  };
}

/**
 * Registra un usuario válido contra la API (POST /api/users/register) y
 * devuelve el usuario creado ya con su `_id`. `request` es la instancia
 * de supertest(app) del archivo que llama a este helper.
 */
async function createUser(request, overrides = {}) {
  const payload = validUserPayload(overrides);
  const res = await request.post('/api/users/register').send(payload);
  if (res.status !== 201) {
    throw new Error(
      `No se pudo crear el usuario de prueba (status ${res.status}): ${JSON.stringify(res.body)}`
    );
  }
  return res.body.data;
}

/**
 * Payload de pedido válido. Necesita el id de un customer real
 * (usá createUser primero para conseguirlo).
 */
function validOrderPayload(customerId, overrides = {}) {
  return {
    customer: customerId,
    items: [
      { productName: 'Producto de prueba A', quantity: 2, unitPrice: 100 },
      { productName: 'Producto de prueba B', quantity: 1, unitPrice: 50 },
    ],
    priority: 'MEDIUM',
    ...overrides,
  };
}

module.exports = {
  validUserPayload,
  createUser,
  validOrderPayload,
};
