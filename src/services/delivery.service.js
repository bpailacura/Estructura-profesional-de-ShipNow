const path = require('path');
const deliveryRepository = require('../repositories/delivery.repository');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { DELIVERY_STATUS, USER_ROLES, DOCUMENT_TYPES } = require('../constants');
const { NotFoundError, ValidationError, ConflictError, FileError } = require('../errors/domainErrors');
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

  // Sube y asocia un comprobante (foto de entrega, firma, recibo, etc.)
  // a una entrega existente. `file` viene de req.file (Multer).
  async addDeliveryProof(deliveryId, file, documentType) {
    await this.getDeliveryById(deliveryId); // 404 si la entrega no existe

    if (!file) {
      throw new FileError('FILE_REQUIRED');
    }

    // Para comprobantes el tipo de documento es opcional: si no se
    // manda, se asume DELIVERY_PROOF; si se manda, tiene que ser válido.
    const resolvedType = documentType || DOCUMENT_TYPES.DELIVERY_PROOF;
    this._validateDocumentType(resolvedType);

    const proofData = {
      originalName: file.originalname,
      storedName: file.filename,
      path: path.relative(process.cwd(), file.path),
      mimeType: file.mimetype,
      size: file.size,
      documentType: resolvedType,
    };

    let updatedDelivery;
    try {
      updatedDelivery = await deliveryRepository.addProof(deliveryId, proofData);
    } catch (error) {
      logger.error(`Error al guardar los metadatos del comprobante de la entrega ${deliveryId}: ${error.message}`);
      throw new FileError('FILE_UPLOAD_FAILED', { message: error.message });
    }

    logger.info(`Comprobante asociado a la entrega ${deliveryId} (archivo: ${file.originalname})`);
    return updatedDelivery;
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

  _validateDocumentType(documentType) {
    if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
      throw new FileError('INVALID_DOCUMENT_TYPE', {
        details: { field: 'documentType', received: documentType, allowed: Object.values(DOCUMENT_TYPES) },
      });
    }
  }
}

module.exports = new DeliveryService();
