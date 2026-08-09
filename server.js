const mongoose = require('mongoose');
const app = require('./src/app');
const config = require('./src/config/env.config');
const logger = require('./src/config/logger.config');

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('Conexión a MongoDB establecida');

    app.listen(config.port, () => {
      logger.info(`Servidor ShipNow escuchando en el puerto ${config.port} (modo "${config.nodeEnv}")`);
    });
  } catch (error) {
    // Falla al conectar a MongoDB o al levantar el server: la app no
    // puede seguir, así que se loguea como fatal antes de cortar el proceso.
    logger.fatal(`No se pudo iniciar la aplicación: ${error.message}`);
    process.exit(1);
  }
}

// Problemas de conexión que aparecen DESPUÉS del arranque exitoso
// (ej: Mongo se cae mientras la app ya está corriendo).
mongoose.connection.on('error', (error) => {
  logger.error(`Error de conexión a MongoDB: ${error.message}`);
});

start();
