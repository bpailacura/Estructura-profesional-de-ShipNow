const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const config = require('./env.config');

/**
 * src/config/swagger.config.js
 *
 * Configuración de Swagger/OpenAPI, separada de app.js y de las rutas.
 * Las anotaciones @swagger viven en src/docs/*.docs.js (archivos que NO
 * contienen lógica, solo comentarios JSDoc leídos por swagger-jsdoc).
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ShipNow API',
    version: '1.0.0',
    description:
      'API de ShipNow — gestión de usuarios, productos, pedidos y entregas, con arquitectura Controller → Service → Repository. ' +
      'Los endpoints de "Mocks" generan datos de prueba (@faker-js/faker) y "Logger" es una herramienta interna de validación, no funcionalidad de negocio.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api`,
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Users', description: 'Registro y gestión de usuarios.' },
    { name: 'Products', description: 'Catálogo de productos.' },
    { name: 'Orders', description: 'Gestión de pedidos.' },
    { name: 'Deliveries', description: 'Gestión de entregas.' },
    { name: 'Mocks', description: 'Generación de datos de prueba.' },
    { name: 'Logger', description: 'Herramienta interna de validación del logger.' },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, '..', 'docs', '*.docs.js')],
};

module.exports = swaggerJsdoc(options);
