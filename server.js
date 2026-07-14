const mongoose = require('mongoose');
const app = require('./src/app');
const config = require('./src/config/env.config');

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[DB] Conectado a MongoDB');

    app.listen(config.port, () => {
      console.log(`[Server] Corriendo en modo "${config.nodeEnv}" en el puerto ${config.port}`);
    });
  } catch (error) {
    console.error('[Server] No se pudo iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

start();
