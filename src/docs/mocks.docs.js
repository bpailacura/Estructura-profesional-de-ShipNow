/**
 * @swagger
 * tags:
 *   name: Mocks
 *   description: Generación de datos de prueba con @faker-js/faker. Los endpoints GET solo previsualizan (no guardan nada); POST /mocks/seed inserta datos relacionados de verdad en MongoDB.
 */

/**
 * @swagger
 * /mocks/users:
 *   get:
 *     summary: Previsualizar usuarios simulados (no se guardan en la base)
 *     tags: [Mocks]
 *     parameters:
 *       - in: query
 *         name: count
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Cantidad de usuarios a generar (1 a 50).
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER, DELIVERY_PERSON]
 *         description: Si no se manda, el rol se sortea con una distribución realista.
 *     responses:
 *       200:
 *         description: Usuarios simulados generados (nunca incluyen passwordHash).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: El parámetro count es inválido (no numérico, negativo, decimal o fuera de rango 1-50 → INVALID_MOCK_COUNT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /mocks/orders:
 *   get:
 *     summary: Previsualizar pedidos simulados (no se guardan en la base)
 *     description: Los ids de "customer" de los items son ObjectIds simulados, solo para mostrar la forma del dato.
 *     tags: [Mocks]
 *     parameters:
 *       - in: query
 *         name: count
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Pedidos simulados generados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       400:
 *         description: El parámetro count es inválido (INVALID_MOCK_COUNT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /mocks/deliveries:
 *   get:
 *     summary: Previsualizar entregas simuladas (no se guardan en la base)
 *     tags: [Mocks]
 *     parameters:
 *       - in: query
 *         name: count
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Entregas simuladas generadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: El parámetro count es inválido (INVALID_MOCK_COUNT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /mocks/seed:
 *   post:
 *     summary: Generar e insertar en MongoDB un set de datos de prueba relacionado
 *     description: Crea usuarios (con al menos un cliente y un repartidor), pedidos asociados a esos clientes y entregas asociadas a esos pedidos y repartidores. La cantidad de entregas nunca supera la cantidad de pedidos (relación 1 a 1).
 *     tags: [Mocks]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MockSeedInput'
 *     responses:
 *       201:
 *         description: Resumen de lo insertado y una muestra de un documento de cada tipo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Alguno de usersCount, ordersCount o deliveriesCount es inválido (INVALID_MOCK_COUNT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Falla real contra MongoDB durante la inserción (MOCK_SEED_FAILURE).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
