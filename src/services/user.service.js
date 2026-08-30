const path = require('path');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { USER_ROLES, DOCUMENT_TYPES } = require('../constants');
const { NotFoundError, ConflictError, ValidationError, FileError } = require('../errors/domainErrors');
const logger = require('../config/logger.config');

const SALT_ROUNDS = 10;

class UserService {
  async getAllUsers() {
    return userRepository.getAll();
  }

  async getUserById(id) {
    const user = await userRepository.getById(id);
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND');
    }
    return user;
  }

  async registerUser({ name, email, password, role }) {
    this._validateRegistration({ name, email, password });

    const existing = await userRepository.getByEmailWithPassword(email);
    if (existing) {
      throw new ConflictError('USER_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Regla de negocio: nunca confiamos en que el cliente mande ADMIN.
    // Solo se permite asignar USER en el registro público.
    const safeRole = role === USER_ROLES.ADMIN ? USER_ROLES.USER : USER_ROLES.USER;

    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role: safeRole,
    });

    // No devolvemos el hash aunque el repository lo haya guardado
    const { passwordHash: _omit, ...safeUser } = user.toObject();
    logger.info(`Usuario registrado correctamente: ${safeUser.email} (rol: ${safeUser.role})`);
    return safeUser;
  }

  async updateUser(id, updateData) {
    await this.getUserById(id);

    // Nunca se actualiza el rol ni el password por esta vía genérica
    const { role, password, passwordHash, ...safeUpdate } = updateData;

    return userRepository.updateById(id, safeUpdate);
  }

  // Sube y asocia un documento (DNI, licencia, etc.) a un usuario existente.
  // `file` viene de req.file (Multer, ya guardado en disco por el middleware).
  async addUserDocument(userId, file, documentType) {
    await this.getUserById(userId); // 404 si el usuario no existe

    if (!file) {
      throw new FileError('FILE_REQUIRED');
    }

    this._validateDocumentType(documentType);

    const documentData = {
      originalName: file.originalname,
      storedName: file.filename,
      path: path.relative(process.cwd(), file.path),
      mimeType: file.mimetype,
      size: file.size,
      documentType,
    };

    let updatedUser;
    try {
      updatedUser = await userRepository.addDocument(userId, documentData);
    } catch (error) {
      logger.error(`Error al guardar los metadatos del documento del usuario ${userId}: ${error.message}`);
      throw new FileError('FILE_UPLOAD_FAILED', { message: error.message });
    }

    logger.info(
      `Documento cargado correctamente para el usuario ${userId} (tipo: ${documentType}, archivo: ${file.originalname})`
    );
    return updatedUser;
  }

  async deleteUser(id) {
    await this.getUserById(id);
    return userRepository.deleteById(id);
  }

  _validateRegistration({ name, email, password }) {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "name" es obligatorio',
        details: { field: 'name' },
      });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "email" no es válido',
        details: { field: 'email' },
      });
    }
    if (!password || password.length < 6) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El "password" debe tener al menos 6 caracteres',
        details: { field: 'password' },
      });
    }
  }

  _validateDocumentType(documentType) {
    if (!documentType || typeof documentType !== 'string') {
      throw new FileError('VALIDATION_ERROR', {
        message: 'El campo "documentType" es obligatorio',
        details: { field: 'documentType' },
      });
    }
    if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
      throw new FileError('INVALID_DOCUMENT_TYPE', {
        details: { field: 'documentType', received: documentType, allowed: Object.values(DOCUMENT_TYPES) },
      });
    }
  }
}

module.exports = new UserService();
