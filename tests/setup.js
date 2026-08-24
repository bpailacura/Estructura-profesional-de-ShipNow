// tests/setup.js
//
// Root hooks de Mocha para toda la suite de testing funcional.
// Se carga UNA sola vez, antes que cualquier archivo *.test.js, vía
// `--require tests/setup.js` en el script "test" de package.json.
//
// Responsabilidades:
//   1. Cargar .env.test (entorno de testing separado del de desarrollo)
//      ANTES de que cualquier otro módulo (app.js, env.config.js) lea
//      process.env. Como dotenv.config() nunca pisa una variable que
//      ya existe en process.env, cargar .env.test acá primero hace que
//      el dotenv.config() interno de env.config.js no tenga nada que
//      sobrescribir: gana el archivo de testing.
//   2. Conectar a la base de datos de testing (MONGODB_URI de .env.test,
//      NUNCA la de desarrollo/producción) antes de correr los tests.
//   3. Limpiar todas las colecciones después de CADA test individual,
//      para que ningún test dependa de datos dejados por otro ni del
//      orden de ejecución.
//   4. Cerrar la conexión a Mongo al final de toda la suite.

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Cinturón y tirantes: aunque .env.test ya trae NODE_ENV=test, lo forzamos
// acá por si alguien corre la suite sin pasar por el script de package.json.
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const config = require('../src/config/env.config');

// Salvavidas de seguridad: jamás correr la suite de tests contra algo que
// no sea explícitamente una base de "testing". Evita el desastre de vaciar
// por accidente la base de desarrollo si falta o está mal el .env.test.
if (!/test/i.test(config.mongoUri)) {
  throw new Error(
    `[tests/setup] MONGODB_URI ("${config.mongoUri}") no parece una base de testing. ` +
      'Revisá tu .env.test antes de correr la suite (se esperaba que el nombre de la base incluya "test").'
  );
}

async function cleanDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

exports.mochaHooks = {
  async beforeAll() {
    this.timeout(20000);
    await mongoose.connect(config.mongoUri);
  },

  async afterEach() {
    await cleanDatabase();
  },

  async afterAll() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  },
};
