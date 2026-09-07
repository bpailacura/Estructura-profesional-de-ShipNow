const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { ORDER_STATUS } = require('../constants');
const { NotFoundError, ValidationError } = require('../errors/domainErrors');
const { parsePagination, buildMeta } = require('../utils/pagination.util');
const logger = require('../config/logger.config');

class OrderService {
  async getAllOrders({ status, page, limit } = {}) {
    const filters = status ? { status } : {};
    const pagination = parsePagination({ page, limit });

    const [data, total] = await Promise.all([
      orderRepository.getAll(filters, pagination),
      orderRepository.count(filters),
    ]);

    return { data, meta: buildMeta({ ...pagination, total }) };
  }

  async getOrderById(id) {
    const order = await orderRepository.getById(id);
    if (!order) {
      throw new NotFoundError('ORDER_NOT_FOUND');
    }
    return order;
  }

  async createOrder({ customer, items, priority }) {
    await this._validateCustomer(customer);
    this._validateItems(items);

    // Regla de negocio: el total nunca lo manda el cliente, se calcula
    // en el servidor a partir de los items para evitar inconsistencias.
    const totalAmount = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );

    const order = await orderRepository.create({
      customer,
      items,
      priority,
      totalAmount,
      status: ORDER_STATUS.PENDING,
    });

    logger.info(`Pedido creado correctamente (id: ${order._id}, total: ${totalAmount})`);
    return order;
  }

  async updateOrderStatus(id, status) {
    await this.getOrderById(id); // valida que exista (lanza 404 si no)

    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new ValidationError('INVALID_ORDER_STATUS', {
        details: { field: 'status', received: status, allowed: Object.values(ORDER_STATUS) },
      });
    }

    return orderRepository.updateStatusById(id, status);
  }

  async deleteOrder(id) {
    await this.getOrderById(id);
    return orderRepository.deleteById(id);
  }

  async _validateCustomer(customer) {
    if (!customer || typeof customer !== 'string') {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El campo "customer" es obligatorio y debe ser el id de un usuario',
        details: { field: 'customer' },
      });
    }
    const user = await userRepository.getById(customer);
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND');
    }
  }

  _validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('VALIDATION_ERROR', {
        message: 'El pedido debe tener al menos un item en "items"',
        details: { field: 'items' },
      });
    }
    items.forEach((item, index) => {
      if (!item.productName || typeof item.productName !== 'string') {
        throw new ValidationError('VALIDATION_ERROR', {
          message: `El item ${index} debe tener "productName"`,
          details: { field: `items[${index}].productName` },
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        throw new ValidationError('VALIDATION_ERROR', {
          message: `El item ${index} debe tener "quantity" mayor o igual a 1`,
          details: { field: `items[${index}].quantity` },
        });
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        throw new ValidationError('VALIDATION_ERROR', {
          message: `El item ${index} debe tener "unitPrice" mayor o igual a 0`,
          details: { field: `items[${index}].unitPrice` },
        });
      }
    });
  }
}

module.exports = new OrderService();
