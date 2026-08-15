const Order = require('../models/order.model');

/**
 * OrderRepository
 * Única capa que importa el modelo de Mongoose para Orders.
 */
class OrderRepository {
  static DEFAULT_PROJECTION = '-__v';

  async getAll(filters = {}) {
    return Order.find(filters, OrderRepository.DEFAULT_PROJECTION).lean();
  }

  async getById(id) {
    return Order.findById(id, OrderRepository.DEFAULT_PROJECTION).lean();
  }

  async create(orderData) {
    const order = new Order(orderData);
    return order.save();
  }

  // Inserción controlada de varios documentos a la vez (usada por el módulo de mocks).
  async insertMany(ordersData) {
    return Order.insertMany(ordersData);
  }

  async updateStatusById(id, status) {
    return Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select(OrderRepository.DEFAULT_PROJECTION);
  }

  async deleteById(id) {
    return Order.findByIdAndDelete(id);
  }
}

module.exports = new OrderRepository();
