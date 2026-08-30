/**
 * src/config/multer.config.js
 *
 * Configuración centralizada de Multer, separada de los routers.
 * Acá se define: dónde se guardan los archivos, cómo se nombran,
 * qué tipos se aceptan, el tamaño máximo, y cómo se traducen los
 * errores de Multer al formato de error de la app (AppError).
 *
 * Ningún router ni controller debe instanciar Multer directamente:
 * todos importan los middlewares ya armados desde acá.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { UPLOAD_LIMITS } = require('../constants');
const { FileError } = require('../errors/domainErrors');
const logger = require('./logger.config');

// Carpeta raíz de uploads, con una subcarpeta por tipo de entidad.
// No va al repo (ver .gitignore) — se recrea sola al arrancar la app.
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

const UPLOAD_SUBFOLDERS = Object.freeze({
  userDocuments: path.join(UPLOADS_ROOT, 'users'),
  deliveryProofs: path.join(UPLOADS_ROOT, 'deliveries'),
});

Object.values(UPLOAD_SUBFOLDERS).forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// Nombre generado: timestamp + hex random, conservando la extensión
// original. Nunca se guarda el archivo con el nombre que mandó el
// cliente (evita colisiones y path traversal).
function generateStoredFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function buildStorage(subfolderKey) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_SUBFOLDERS[subfolderKey]),
    filename: (req, file, cb) => cb(null, generateStoredFilename(file.originalname)),
  });
}

// Solo se aceptan imágenes y PDF (documentos/comprobantes típicos).
function fileFilter(req, file, cb) {
  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warning(
      `Intento de carga con tipo de archivo no permitido: campo "${file.fieldname}", mimetype "${file.mimetype}"`
    );
    return cb(
      new FileError('INVALID_FILE_TYPE', {
        details: { field: file.fieldname, mimetype: file.mimetype, allowed: UPLOAD_LIMITS.ALLOWED_MIME_TYPES },
      })
    );
  }
  return cb(null, true);
}

function buildUploader(subfolderKey) {
  return multer({
    storage: buildStorage(subfolderKey),
    fileFilter,
    limits: {
      fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  }).single('file'); // el campo del archivo siempre se llama "file"
}

// Traduce cualquier error salido de Multer (los nuestros de fileFilter,
// o los propios MulterError de límites) a un FileError uniforme.
function normalizeUploadError(err) {
  if (err instanceof FileError) {
    return err;
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new FileError('FILE_TOO_LARGE', {
      details: { maxBytes: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES },
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new FileError('UNEXPECTED_FILE_FIELD', {
      details: { expectedField: 'file', received: err.field },
    });
  }
  logger.error(`Error inesperado al subir un archivo: ${err.message}`);
  return new FileError('FILE_UPLOAD_FAILED', { message: err.message });
}

// Envuelve un uploader de Multer como middleware Express normal,
// para que los errores lleguen a error.middleware.js como cualquier
// otro (vía next(err)), en vez de que Multer los devuelva "crudos".
function handleUpload(subfolderKey) {
  const uploader = buildUploader(subfolderKey);
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) {
        return next(normalizeUploadError(err));
      }
      return next();
    });
  };
}

module.exports = {
  UPLOAD_SUBFOLDERS,
  uploadUserDocument: handleUpload('userDocuments'),
  uploadDeliveryProof: handleUpload('deliveryProofs'),
};
