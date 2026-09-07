const Product = require('../models/product.model');

/**
 * ProductRepository
 * Única capa que importa el modelo de Mongoose para Products.
 * No contiene reglas de negocio: solo sabe buscar, filtrar y guardar.
 */
class ProductRepository {
  // Proyección por defecto: nunca devolvemos campos internos de Mongo (__v)
  static DEFAULT_PROJECTION = '-__v';

  async getAll(filters = {}, { skip = 0, limit = 0 } = {}) {
    // Encapsula un filtro por defecto: por ejemplo, nunca devolver
    // productos "borrados" si en el futuro se agrega soft-delete.
    let query = Product.find(filters, ProductRepository.DEFAULT_PROJECTION).lean();
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    return query;
  }

  async count(filters = {}) {
    return Product.countDocuments(filters);
  }

  async getById(id) {
    return Product.findById(id, ProductRepository.DEFAULT_PROJECTION).lean();
  }

  async create(productData) {
    const product = new Product(productData);
    return product.save();
  }

  async updateById(id, updateData) {
    return Product.findByIdAndUpdate(id, updateData, {
      new: true, // devuelve el doc ya actualizado
      runValidators: true, // corre las validaciones del schema en el update
    });
  }

  async deleteById(id) {
    return Product.findByIdAndDelete(id);
  }

  async findByStatus(status) {
    return Product.find({ status }, ProductRepository.DEFAULT_PROJECTION).lean();
  }
}

module.exports = new ProductRepository();
