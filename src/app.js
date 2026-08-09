const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const logger = require('./config/logger.config');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', routes);

// 404 para rutas no definidas
app.use((req, res) => {
  logger.warning(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: { message: 'Ruta no encontrada' } });
});

// Siempre al final: middleware de errores
app.use(errorHandler);

module.exports = app;
