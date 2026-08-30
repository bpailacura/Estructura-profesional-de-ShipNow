const mongoose = require('mongoose');
const { USER_ROLES } = require('../constants');
const fileMetadataSchema = require('./shared/fileMetadata.schema');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    // Documentos cargados por/sobre el usuario (DNI, licencia, etc.).
    // Solo metadatos: el archivo vive en uploads/users/ (ver multer.config.js).
    documents: { type: [fileMetadataSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
