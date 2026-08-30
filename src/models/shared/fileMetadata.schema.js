const mongoose = require('mongoose');

/**
 * src/models/shared/fileMetadata.schema.js
 *
 * Subschema reutilizable para archivos subidos con Multer (documentos
 * de usuario, comprobantes de entrega). En Mongo SOLO se guardan estos
 * metadatos — el archivo en sí vive en el filesystem, no en la base.
 *
 * `documentType` se valida contra DOCUMENT_TYPES a nivel Service, no
 * acá, para poder dar mensajes de error consistentes con el resto del
 * proyecto (ver errors/domainErrors.js).
 */
const fileMetadataSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true }, // nombre con el que lo subió el cliente
    storedName: { type: String, required: true }, // nombre generado en disco (único)
    path: { type: String, required: true }, // ruta relativa dentro de uploads/
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    documentType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

module.exports = fileMetadataSchema;
