/**
 * @swagger
 * tags:
 *   name: Logger
 *   description: Endpoint interno de validación del logger. NO es una funcionalidad de negocio — solo sirve para verificar rápido que Winston está bien configurado.
 */

/**
 * @swagger
 * /logger/test:
 *   get:
 *     summary: Disparar un log de prueba en cada nivel configurado
 *     description: Dispara un mensaje en los 6 niveles (debug, http, info, warning, error, fatal) para poder chequear que aparecen donde corresponde (consola y carpeta /logs). Es una herramienta de validación interna, no representa una operación de negocio.
 *     tags: [Logger]
 *     responses:
 *       200:
 *         description: Logs de prueba generados correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Se generaron logs de prueba en los 6 niveles (debug, http, info, warning, error, fatal). Revisá la consola y la carpeta /logs.
 */

module.exports = {};
