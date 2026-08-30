const User = require('../models/user.model');

/**
 * UserRepository
 * Única capa que importa el modelo de Mongoose para Users.
 */
class UserRepository {
  // Nunca devolvemos el hash de la contraseña por defecto
  static DEFAULT_PROJECTION = '-__v -passwordHash';

  async getAll() {
    return User.find({}, UserRepository.DEFAULT_PROJECTION).lean();
  }

  async getById(id) {
    return User.findById(id, UserRepository.DEFAULT_PROJECTION).lean();
  }

  // Este método sí necesita el hash (para comparar en el login),
  // por eso tiene su propia proyección explícita.
  async getByEmailWithPassword(email) {
    return User.findOne({ email }, '-__v').lean();
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  // Inserción controlada de varios documentos a la vez (usada por el módulo de mocks).
  async insertMany(usersData) {
    return User.insertMany(usersData);
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select(UserRepository.DEFAULT_PROJECTION);
  }

  // Agrega un documento (metadatos de archivo) al array "documents" del usuario.
  async addDocument(id, documentData) {
    return User.findByIdAndUpdate(
      id,
      { $push: { documents: documentData } },
      { new: true, runValidators: true }
    ).select(UserRepository.DEFAULT_PROJECTION);
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
