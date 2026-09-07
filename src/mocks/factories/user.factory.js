const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const { USER_ROLES } = require('../../constants');

// Password de prueba para todos los usuarios mockeados. Se documenta en el
// README: nunca se usa para credenciales reales, solo para completar el schema.
const MOCK_PASSWORD = 'Mock1234!';
// Costo de hash bajo a propósito: son datos de prueba, no credenciales reales,
// y así generar muchos usuarios de golpe no se hace lento.
const MOCK_SALT_ROUNDS = 4;

const ASSIGNABLE_ROLES = Object.values(USER_ROLES);

// Distribución realista: la mayoría "USER", una porción de repartidores
// y pocos admins. Siempre construida a partir de USER_ROLES, sin strings sueltos.
const ROLE_WEIGHTS = [
  { role: USER_ROLES.USER, weight: 0.6 },
  { role: USER_ROLES.DELIVERY_PERSON, weight: 0.3 },
  { role: USER_ROLES.ADMIN, weight: 0.1 },
];

function pickWeightedRole() {
  const roll = Math.random();
  let acc = 0;
  for (const { role, weight } of ROLE_WEIGHTS) {
    acc += weight;
    if (roll <= acc) return role;
  }
  return USER_ROLES.USER;
}

/**
 * Construye un objeto de usuario simulado (no lo guarda en la base).
 * @param {{ role?: string }} options - rol forzado; si no se pasa, se sortea.
 */
async function buildUser({ role } = {}) {
  if (role && !ASSIGNABLE_ROLES.includes(role)) {
    const error = new Error(`Rol de mock inválido: "${role}"`);
    error.statusCode = 400;
    throw error;
  }

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    passwordHash: await bcrypt.hash(MOCK_PASSWORD, MOCK_SALT_ROUNDS),
    role: role || pickWeightedRole(),
  };
}

function buildUsers(count, options = {}) {
  // Se generan en paralelo (Promise.all) en vez de hashear uno por uno
  // en un loop sync: con async bcrypt.hash cada hash libera el Event Loop.
  return Promise.all(Array.from({ length: count }, () => buildUser(options)));
}

module.exports = {
  buildUser,
  buildUsers,
  MOCK_PASSWORD,
};
