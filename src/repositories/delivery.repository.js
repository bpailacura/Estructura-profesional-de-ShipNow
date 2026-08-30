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

  async updateStatusById(id, status) {
    return Delivery.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select(DeliveryRepository.DEFAULT_PROJECTION);
  }

  // Agrega un comprobante (metadatos de archivo) al array "proofs" de la entrega.
  async addProof(id, proofData) {
    return Delivery.findByIdAndUpdate(
      id,
      { $push: { proofs: proofData } },
      { new: true, runValidators: true }
    ).select(DeliveryRepository.DEFAULT_PROJECTION);
  }

  async deleteById(id) {
    return Delivery.findByIdAndDelete(id);
  }
}

module.exports = new DeliveryRepository();
