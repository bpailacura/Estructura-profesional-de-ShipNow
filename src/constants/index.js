/**
 * src/constants/index.js
 *
 * Valores fijos del dominio de negocio (no cambian entre entornos).
 * Object.freeze evita que alguien los mute accidentalmente en runtime.
 */

const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  USER: 'USER',
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

module.exports = {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
};
