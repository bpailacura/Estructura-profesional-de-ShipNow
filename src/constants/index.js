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

// Tipos de documento válidos para los archivos que se cargan al sistema
// (documentos de usuario y comprobantes de entrega comparten el mismo
// catálogo; cada Service valida cuáles aplican en cada contexto).
const DOCUMENT_TYPES = Object.freeze({
  DNI_FRONT: 'DNI_FRONT',
  DNI_BACK: 'DNI_BACK',
  DRIVER_LICENSE: 'DRIVER_LICENSE',
  DELIVERY_PROOF: 'DELIVERY_PROOF',
  OTHER: 'OTHER',
});

// Configuración de validación para la carga de archivos (Multer).
const UPLOAD_LIMITS = Object.freeze({
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

module.exports = {
  USER_ROLES,
  PRODUCT_STATUS,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  DOCUMENT_TYPES,
  UPLOAD_LIMITS,
};
