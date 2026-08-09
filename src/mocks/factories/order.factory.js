const { faker } = require('@faker-js/faker');
const { ORDER_STATUS, ORDER_PRIORITY } = require('../../constants');

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function buildOrderItems(availableProducts = []) {
  const itemCount = faker.number.int({ min: 1, max: 3 });

  return Array.from({ length: itemCount }, () => {
    // Si hay productos reales cargados en la base, los referenciamos
    // (relación real order -> product). Si no, se sintetiza uno.
    if (availableProducts.length > 0) {
      const product = pickRandom(availableProducts);
      return {
        product: product._id,
        productName: product.name,
        quantity: faker.number.int({ min: 1, max: 5 }),
        unitPrice: product.price,
      };
    }

    return {
      productName: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 5 }),
      unitPrice: Number(faker.commerce.price({ min: 5, max: 300 })),
    };
  });
}

/**
 * Construye un pedido simulado asociado a un usuario "customer" existente.
 * @param {{ customerId: string, availableProducts?: Array }} params
 */
function buildOrder({ customerId, availableProducts = [] }) {
  if (!customerId) {
    const error = new Error('buildOrder requiere un customerId (usuario existente)');
    error.statusCode = 400;
    throw error;
  }

  const items = buildOrderItems(availableProducts);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    customer: customerId,
    items,
    status: pickRandom(Object.values(ORDER_STATUS)),
    priority: pickRandom(Object.values(ORDER_PRIORITY)),
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

function buildOrders(count, { customerIds, availableProducts = [] }) {
  if (!Array.isArray(customerIds) || customerIds.length === 0) {
    const error = new Error('buildOrders requiere al menos un customerId disponible');
    error.statusCode = 400;
    throw error;
  }

  return Array.from({ length: count }, () =>
    buildOrder({ customerId: pickRandom(customerIds), availableProducts })
  );
}

module.exports = {
  buildOrder,
  buildOrders,
};
