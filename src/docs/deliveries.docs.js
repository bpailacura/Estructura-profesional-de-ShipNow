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
 * /deliveries/{id}/proof:
 *   post:
 *     summary: Cargar un comprobante de entrega (foto, firma, recibo, etc.)
 *     description: >
 *       Sube un archivo asociado a la entrega y registra sus metadatos.
 *       El campo "documentType" es opcional: si no se envía, se asume
 *       DELIVERY_PROOF; si se envía, tiene que ser uno de los valores
 *       permitidos. El archivo en sí NO se guarda en Mongo, solo en el
 *       filesystem del servidor.
 *     tags: [Deliveries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Id de Mongo de la entrega.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/DeliveryProofUploadInput'
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png, image/webp, application/pdf
 *     responses:
 *       201:
 *         description: Comprobante cargado y asociado a la entrega.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Delivery'
 *       400:
 *         description: >
 *           Archivo faltante (FILE_REQUIRED), tipo de archivo no permitido
 *           (INVALID_FILE_TYPE), archivo demasiado grande (FILE_TOO_LARGE),
 *           campo de archivo inesperado (UNEXPECTED_FILE_FIELD) o tipo de
 *           documento inválido (INVALID_DOCUMENT_TYPE).
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
 *       500:
 *         description: Error al guardar el archivo (FILE_UPLOAD_FAILED).
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
