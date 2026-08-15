/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Gestión de entregas (relación 1 a 1 con un pedido, asignadas a un usuario con rol DELIVERY_PERSON).
 */

/**
 * @swagger
 * /deliveries:
 *   get:
 *     summary: Listar entregas
 *     tags: [Deliveries]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, IN_TRANSIT, DELIVERED, FAILED]
 *         description: Filtra las entregas por status.
 *     responses:
 *       200:
 *         description: Lista de entregas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 */

/**
 * @swagger
 * /deliveries/{id}:
 *   get:
 *     summary: Obtener una entrega por id
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entrega encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: El id no tiene formato de ObjectId válido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Entrega no encontrada (DELIVERY_NOT_FOUND).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /deliveries:
 *   post:
 *     summary: Crear una entrega para un pedido
 *     description: Valida que el pedido exista, que el usuario asignado tenga rol DELIVERY_PERSON, y que el pedido no tenga ya una entrega asociada (relación 1 a 1). El status inicial siempre es ASSIGNED.
 *     tags: [Deliveries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryCreateInput'
 *     responses:
 *       201:
 *         description: Entrega creada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Datos inválidos (order/deliveryPerson/address/estimatedDeliveryDate faltantes o mal formados, o el usuario asignado no tiene rol DELIVERY_PERSON).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: El pedido (ORDER_NOT_FOUND) o el usuario (USER_NOT_FOUND) indicado no existen.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El pedido ya tiene una entrega asociada (DELIVERY_ALREADY_EXISTS).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /deliveries/{id}/status:
 *   put:
 *     summary: Cambiar el status de una entrega
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryStatusUpdateInput'
 *     responses:
 *       200:
 *         description: Entrega con el status actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: Status inválido, fuera del enum ASSIGNED/IN_TRANSIT/DELIVERED/FAILED (INVALID_DELIVERY_STATUS).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Entrega no encontrada (DELIVERY_NOT_FOUND).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /deliveries/{id}:
 *   delete:
 *     summary: Eliminar una entrega
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Entrega eliminada (sin contenido en la respuesta).
 *       404:
 *         description: Entrega no encontrada (DELIVERY_NOT_FOUND).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
