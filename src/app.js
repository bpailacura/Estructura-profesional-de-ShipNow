const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const blockInProduction = require('./middlewares/blockInProduction.middleware');
const logger = require('./config/logger.config');
const config = require('./config/env.config');
const swaggerSpec = require('./config/swagger.config');

const app = express();

app.use(express.json());

// Health check: estado del proceso, entorno y hace cuánto está arriba.
// A propósito NO expone nada sensible (ni mongoUri, ni jwtSecret, ni
// ningún dato de negocio) -- solo lo mínimo para un chequeo de vida.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Documentación interactiva de la API (Swagger UI). Configuración
// centralizada en src/config/swagger.config.js — separada de la
// lógica de rutas de negocio.
// Endpoint interno de desarrollo: bloqueado en producción (ver
// blockInProduction.middleware.js) -- no tiene sentido exponer la forma
// completa de la API a quien no la necesita para trabajar sobre ella.
app.use('/api/docs', blockInProduction, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

// 404 para rutas no definidas
app.use((req, res) => {
  logger.warning(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: { message: 'Ruta no encontrada' } });
});

// Siempre al final: middleware de errores
app.use(errorHandler);

module.exports = app;
