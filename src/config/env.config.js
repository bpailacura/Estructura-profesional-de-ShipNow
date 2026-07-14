/**
 * src/config/env.config.js
 *
 * Único lugar del proyecto donde se lee process.env directamente.
 * Todo lo demás (controllers, services, repositories) debe recibir
 * la configuración importando este módulo, nunca leyendo process.env.
 */

const dotenv = require('dotenv');
dotenv.config();

// Variables que la app NECESITA para arrancar. Si falta alguna,
// preferimos que la app explote acá, con un mensaje claro,
// antes que arranque "a medias" y falle más tarde de forma confusa.
const REQUIRED_ENV_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value === null || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `[env.config] Faltan variables de entorno obligatorias: ${missing.join(
        ', '
      )}. Revisá tu archivo .env (usá .env.example como referencia).`
    );
  }
}

validateEnv();

const config = Object.freeze({
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || null, // opcional, no rompe el arranque si falta
});

module.exports = config;
