/**
 * src/docs/schemas.docs.js
 *
 * Solo contiene anotaciones @swagger (components.schemas). No exporta
 * lógica: swagger-jsdoc lee este archivo por su ruta (ver
 * src/config/swagger.config.js), nunca se importa desde el código real.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FileMetadata:
 *       type: object
 *       description: Metadatos de un archivo cargado con Multer. El archivo en sí vive en el filesystem del servidor, nunca en Mongo.
 *       properties:
 *         originalName:
 *           type: string
 *           description: Nombre con el que el cliente subió el archivo.
 *           example: dni-frente.jpg
 *         storedName:
 *           type: string
 *           description: Nombre generado en el servidor (único, evita colisiones y path traversal).
 *           example: 1735689600000-3f9a2b7c1d4e5f60.jpg
 *         path:
 *           type: string
 *           description: Ruta relativa dentro de la carpeta uploads/ del servidor.
 *           example: uploads/users/1735689600000-3f9a2b7c1d4e5f60.jpg
 *         mimeType:
 *           type: string
 *           example: image/jpeg
 *         size:
 *           type: integer
 *           description: Tamaño del archivo en bytes.
 *           example: 245678
 *         documentType:
 *           type: string
 *           enum: [DNI_FRONT, DNI_BACK, DRIVER_LICENSE, DELIVERY_PROOF, OTHER]
 *           example: DNI_FRONT
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *
 *     UserDocumentUploadInput:
 *       type: object
 *       required: [file, documentType]
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Archivo a subir (imagen o PDF, máximo 5MB).
 *         documentType:
 *           type: string
 *           enum: [DNI_FRONT, DNI_BACK, DRIVER_LICENSE, OTHER]
 *           example: DNI_FRONT
 *
 *     DeliveryProofUploadInput:
 *       type: object
 *       required: [file]
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: Archivo a subir (imagen o PDF, máximo 5MB).
 *         documentType:
 *           type: string
 *           description: Opcional. Si no se envía, se asume DELIVERY_PROOF.
 *           enum: [DELIVERY_PROOF, OTHER]
 *           example: DELIVERY_PROOF
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d1
 *         name:
 *           type: string
 *           example: Juana Pérez
 *         email:
 *           type: string
 *           format: email
 *           example: juana.perez@example.com
 *         role:
 *           type: string
 *           enum: [ADMIN, USER, DELIVERY_PERSON]
 *           example: USER
 *         documents:
 *           type: array
 *           description: Documentos cargados para este usuario (DNI, licencia, etc.).
 *           items:
 *             $ref: '#/components/schemas/FileMetadata'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserRegisterInput:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *           example: Juana Pérez
 *         email:
 *           type: string
 *           format: email
 *           example: juana.perez@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: superSecreta123
 *         role:
 *           type: string
 *           description: Se ignora por seguridad — el registro público siempre asigna USER.
 *           enum: [ADMIN, USER, DELIVERY_PERSON]
 *
 *     UserUpdateInput:
 *       type: object
 *       description: No permite modificar "role" ni "password" por esta vía.
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d2
 *         name:
 *           type: string
 *           example: Bicicleta urbana
 *         price:
 *           type: number
 *           example: 150000
 *         stock:
 *           type: integer
 *           example: 12
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OUT_OF_STOCK, DISCONTINUED]
 *           example: AVAILABLE
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProductInput:
 *       type: object
 *       required: [name, price]
 *       properties:
 *         name:
 *           type: string
 *           example: Bicicleta urbana
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 150000
 *         stock:
 *           type: integer
 *           minimum: 0
 *           example: 12
 *
 *     OrderItem:
 *       type: object
 *       required: [productName, quantity, unitPrice]
 *       properties:
 *         product:
 *           type: string
 *           description: Id del producto real (opcional, si el item referencia un Product existente).
 *           example: 66f1a2b3c4d5e6f7a8b9c0d2
 *         productName:
 *           type: string
 *           example: Bicicleta urbana
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           example: 150000
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d3
 *         customer:
 *           type: string
 *           description: Id del usuario (cliente) dueño del pedido.
 *           example: 66f1a2b3c4d5e6f7a8b9c0d1
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         status:
 *           type: string
 *           enum: [PENDING, SHIPPED, DELIVERED, CANCELLED]
 *           example: PENDING
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *           example: MEDIUM
 *         totalAmount:
 *           type: number
 *           description: Calculado en el servidor a partir de "items", nunca lo manda el cliente.
 *           example: 300000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     OrderCreateInput:
 *       type: object
 *       required: [customer, items]
 *       properties:
 *         customer:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d1
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *
 *     OrderStatusUpdateInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, SHIPPED, DELIVERED, CANCELLED]
 *           example: SHIPPED
 *
 *     Delivery:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d4
 *         order:
 *           type: string
 *           description: Id del pedido asociado (relación 1 a 1).
 *           example: 66f1a2b3c4d5e6f7a8b9c0d3
 *         deliveryPerson:
 *           type: string
 *           description: Id del usuario con rol DELIVERY_PERSON asignado.
 *           example: 66f1a2b3c4d5e6f7a8b9c0d5
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_TRANSIT, DELIVERED, FAILED]
 *           example: ASSIGNED
 *         address:
 *           type: string
 *           example: Av. Siempreviva 742, Florencio Varela
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date-time
 *         proofs:
 *           type: array
 *           description: Comprobantes cargados para esta entrega (foto, firma, recibo, etc.).
 *           items:
 *             $ref: '#/components/schemas/FileMetadata'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DeliveryCreateInput:
 *       type: object
 *       required: [order, deliveryPerson, address, estimatedDeliveryDate]
 *       properties:
 *         order:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d3
 *         deliveryPerson:
 *           type: string
 *           example: 66f1a2b3c4d5e6f7a8b9c0d5
 *         address:
 *           type: string
 *           example: Av. Siempreviva 742, Florencio Varela
 *         estimatedDeliveryDate:
 *           type: string
 *           format: date-time
 *           example: 2026-08-20T18:00:00.000Z
 *
 *     DeliveryStatusUpdateInput:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [ASSIGNED, IN_TRANSIT, DELIVERED, FAILED]
 *           example: IN_TRANSIT
 *
 *     MockSeedInput:
 *       type: object
 *       description: Todos los campos son opcionales y se limitan entre 1 y 50.
 *       properties:
 *         usersCount:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 15
 *         ordersCount:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 10
 *         deliveriesCount:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 8
 *
 *     SuccessResponse:
 *       type: object
 *       description: Forma genérica de una respuesta exitosa. El contenido real de "data" varía según el endpoint (ver el schema específico documentado en cada operación).
 *       properties:
 *         data:
 *           type: object
 *
 *     PaginationMeta:
 *       type: object
 *       description: Metadata de paginación que acompaña a "data" en los listados grandes (products, users, orders, deliveries).
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           description: Cantidad total de documentos que matchean los filtros aplicados (sin paginar).
 *           example: 47
 *         totalPages:
 *           type: integer
 *           example: 3
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: USER_NOT_FOUND
 *             message:
 *               type: string
 *               example: Usuario no encontrado
 *             details:
 *               type: object
 *               nullable: true
 *               description: Presente solo cuando aplica (ej. qué campo falló una validación).
 *
 *   parameters:
 *     PageParam:
 *       in: query
 *       name: page
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Número de página (1-indexed). Valores inválidos o ausentes caen al default.
 *     LimitParam:
 *       in: query
 *       name: limit
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 20
 *       description: Cantidad de resultados por página. Se recorta automáticamente a 100 como máximo.
 */

module.exports = {};
