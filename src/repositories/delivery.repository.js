const Delivery = require('../models/delivery.model');

/**
 * DeliveryRepository
 * Única capa que importa el modelo de Mongoose para Deliveries.
 */
class DeliveryRepository {
  static DEFAULT_PROJECTION = '-__v';

  async getAll(filters = {}) {
    return Delivery.find(filters, DeliveryRepository.DEFAULT_PROJECTION).lean();
  }

  async getById(id) {
    return Delivery.findById(id, DeliveryRepository.DEFAULT_PROJECTION).lean();
  }

  async create(deliveryData) {
    const delivery = new Delivery(deliveryData);
    return delivery.save();
  }

  // Inserción controlada de varios documentos a la vez (usada por el módulo de mocks).
  async insertMany(deliveriesData) {
    return Delivery.insertMany(deliveriesData);
  }

  async deleteById(id) {
    return Delivery.findByIdAndDelete(id);
  }
}

module.exports = new DeliveryRepository();
