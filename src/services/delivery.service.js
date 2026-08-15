const deliveryRepository = require('../repositories/delivery.repository');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { DELIVERY_STATUS, USER_ROLES } = require('../constants');
const { NotFoundError, ValidationError, ConflictError } = require('../errors/domainErrors');
const logger = require('../config/logger.config');

class DeliveryService {
  async getAllDeliveries({ status } = {}) {
    const filters = status ? { status } : {};
    return deliveryRepository.getAll(filters);
  }

  async getDeliveryById(id) {
    const delivery = await deliveryRepository.getById(id);
    if (!delivery) {
      throw new NotFoundError('DELIVERY_NOT_FOUND');
    }
    return delivery;
  }

  async createDelivery({ order, deliveryPerson, address, estimatedDeliveryDate }) {
    await this._validateOrder(order);
    await this._validateDeliveryPerson(deliveryPerson);
    this._validateAddressAndDate({ address, estimatedDeliveryDate });

    const existing = await deliveryRepository.getAll({ order });
    if (existing.length > 0) {
      // Regla de negocio: relación 1 a 1 entre pedido y entrega.
      throw new ConflictError('DELIVERY_ALREADY_EXISTS');
    }

    const delivery = await deliveryRepository.create({
      order,
      deliveryPerson,
      address,
      estimatedDeliveryDate,
      status: DELIVERY_STATUS.ASSIGNED,
    });

    logger.info(`Entrega creada correctamente (id: ${delivery._id}, pedido: ${order})`);
    return delivery;
  }

  async updateDeliveryStatus(id, status) {
    await this.getDeliveryById(id); // valida que exista (lanza 404 si no)

    if (!Object.values(DELIVERY_STATUS).includes(status)) {
      throw new ValidationError('INVALID_DELIVERY_STATUS', {
        details: { field: 'status', received: status, allowed: Object.values(DELIVERY_STATUS) },
      });
    }

    return deliveryRepository.updateStatusById(id, status);
  }

  async deleteDelivery(id) {
    await this.getDeliveryById(id);
    return deliveryRepository.deleteById(id);
  }

  async _validateOrder(orderId) {
    if (!orderId || typeof orderId !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "order" es obligatorio y debe ser el id de un pedido',
        details: { field: 'order' },
      });
    }
    const order = await orderRepository.getById(orderId);
    if (!order) {
      throw new NotFoundError('ORDER_NOT_FOUND');
    }
  }

  async _validateDeliveryPerson(deliveryPersonId) {
    if (!deliveryPersonId || typeof deliveryPersonId !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "deliveryPerson" es obligatorio y debe ser el id de un usuario',
        details: { field: 'deliveryPerson' },
      });
    }
    const user = await userRepository.getById(deliveryPersonId);
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND');
    }
    if (user.role !== USER_ROLES.DELIVERY_PERSON) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El usuario indicado en "deliveryPerson" no tiene rol DELIVERY_PERSON',
        details: { field: 'deliveryPerson' },
      });
    }
  }

  _validateAddressAndDate({ address, estimatedDeliveryDate }) {
    if (!address || typeof address !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "address" es obligatorio',
        details: { field: 'address' },
      });
    }
    if (!estimatedDeliveryDate || Number.isNaN(Date.parse(estimatedDeliveryDate))) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "estimatedDeliveryDate" debe ser una fecha válida',
        details: { field: 'estimatedDeliveryDate' },
      });
    }
  }
}

module.exports = new DeliveryService();
