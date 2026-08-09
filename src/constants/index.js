/**
 * src/constants/index.js
 *
 * Valores fijos del dominio de negocio (no cambian entre entornos).
 * Object.freeze evita que alguien los mute accidentalmente en runtime.
 */

const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
  DELIVERY_PERSON: 'DELIVERY_PERSON',
});

const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
});

const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

// Prioridad de despacho de un pedido. Afecta el orden en que
// los repartidores deberían tomar las entregas.
const ORDER_PRIORITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
});

// Estado propio de la entrega física, independiente del estado del pedido:
// un pedido puede estar SHIPPED mientras su entrega sigue IN_TRANSIT.
const DELIVERY_STATUS = Object.freeze({
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
});

module.exports = {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
};
