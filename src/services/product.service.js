const productRepository = require('../repositories/product.repository');
const { PRODUCT_STATUS } = require('../constants');
const { NotFoundError, ValidationError } = require('../errors/domainErrors');

class ProductService {
  async getAllProducts({ onlyAvailable = false } = {}) {
    const filters = onlyAvailable ? { status: PRODUCT_STATUS.AVAILABLE } : {};
    return productRepository.getAll(filters);
  }

  async getProductById(id) {
    const product = await productRepository.getById(id);
    if (!product) {
      throw new NotFoundError('PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async createProduct(productData) {
    this._validateProductData(productData);

    // Regla de negocio: si entra con stock 0, el estado inicial
    // debe ser OUT_OF_STOCK, sin importar lo que mande el cliente.
    const status =
      productData.stock === 0 ? PRODUCT_STATUS.OUT_OF_STOCK : PRODUCT_STATUS.AVAILABLE;

    return productRepository.create({ ...productData, status });
  }

  async updateProduct(id, updateData) {
    await this.getProductById(id); // valida que exista (lanza 404 si no)

    // Regla de negocio: si actualizan el stock a 0, el status pasa
    // automáticamente a OUT_OF_STOCK.
    if (updateData.stock === 0) {
      updateData.status = PRODUCT_STATUS.OUT_OF_STOCK;
    } else if (typeof updateData.stock === 'number' && updateData.stock > 0) {
      updateData.status = PRODUCT_STATUS.AVAILABLE;
    }

    return productRepository.updateById(id, updateData);
  }

  async deleteProduct(id) {
    await this.getProductById(id);
    return productRepository.deleteById(id);
  }

  _validateProductData({ name, price, stock }) {
    if (!name || typeof name !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "name" es obligatorio y debe ser texto',
        details: { field: 'name' },
      });
    }
    if (typeof price !== 'number' || price < 0) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "price" debe ser un número mayor o igual a 0',
        details: { field: 'price' },
      });
    }
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "stock" debe ser un número mayor o igual a 0',
        details: { field: 'stock' },
      });
    }
  }
}

module.exports = new ProductService();
