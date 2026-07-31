const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { USER_ROLES } = require('../constants');
const { NotFoundError, ConflictError, ValidationError } = require('../errors/domainErrors');

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
    return safeUser;
  }

  async updateUser(id, updateData) {
    await this.getUserById(id);

    // Nunca se actualiza el rol ni el password por esta vía genérica
    const { role, password, passwordHash, ...safeUpdate } = updateData;

    return userRepository.updateById(id, safeUpdate);
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
}

module.exports = new UserService();
