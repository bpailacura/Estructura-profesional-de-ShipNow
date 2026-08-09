const { faker } = require('@faker-js/faker');
const { DELIVERY_STATUS, ORDER_STATUS } = require('../../constants');

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

// Mantiene coherencia básica entre el estado del pedido y el de su entrega:
// un pedido CANCELLED no debería tener una entrega "en curso" o "entregada".
function pickCoherentDeliveryStatus(orderStatus) {
  if (orderStatus === ORDER_STATUS.CANCELLED) return DELIVERY_STATUS.FAILED;
  if (orderStatus === ORDER_STATUS.DELIVERED) return DELIVERY_STATUS.DELIVERED;
  if (orderStatus === ORDER_STATUS.PENDING) return DELIVERY_STATUS.ASSIGNED;
  return pickRandom(Object.values(DELIVERY_STATUS));
}

/**
 * Construye una entrega simulada asociada a un pedido y a un repartidor existentes.
 * @param {{ orderId: string, deliveryPersonId: string, orderStatus?: string }} params
 */
function buildDelivery({ orderId, deliveryPersonId, orderStatus }) {
  if (!orderId || !deliveryPersonId) {
    const error = new Error(
      'buildDelivery requiere orderId (pedido existente) y deliveryPersonId (repartidor existente)'
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    order: orderId,
    deliveryPerson: deliveryPersonId,
    status: pickCoherentDeliveryStatus(orderStatus),
    address: faker.location.streetAddress({ useFullAddress: true }),
    estimatedDeliveryDate: faker.date.soon({ days: 7 }),
  };
}

/**
 * Construye una entrega por cada pedido recibido, asignando repartidores al azar.
 * @param {{ orders: Array<{_id: string, status: string}>, deliveryPersonIds: string[] }} params
 */
function buildDeliveriesForOrders({ orders, deliveryPersonIds }) {
  if (!Array.isArray(deliveryPersonIds) || deliveryPersonIds.length === 0) {
    const error = new Error(
      'buildDeliveriesForOrders requiere al menos un repartidor (rol DELIVERY_PERSON) disponible'
    );
    error.statusCode = 400;
    throw error;
  }

  return orders.map((order) =>
    buildDelivery({
      orderId: order._id,
      deliveryPersonId: pickRandom(deliveryPersonIds),
      orderStatus: order.status,
    })
  );
}

module.exports = {
  buildDelivery,
  buildDeliveriesForOrders,
};
