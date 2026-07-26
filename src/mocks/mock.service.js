const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const orderRepository = require('../repositories/order.repository');
const deliveryRepository = require('../repositories/delivery.repository');
const productRepository = require('../repositories/product.repository');
const { USER_ROLES, ORDER_STATUS } = require('../constants');
const userFactory = require('./factories/user.factory');
const orderFactory = require('./factories/order.factory');
const deliveryFactory = require('./factories/delivery.factory');

// Límites de seguridad para no permitir cargas descontroladas a la base
// ("de forma controlada" según la consigna).
const MIN_COUNT = 1;
const MAX_PREVIEW_COUNT = 50;
const MAX_SEED_COUNT = 50;

function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(Math.trunc(num), min), max);
}

// Nunca devolvemos el passwordHash, ni siquiera en datos de mock,
// para ser consistentes con cómo se comporta la API real.
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function fakeObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

class MockService {
  // ---- Endpoints de PREVIEW: generan datos con forma realista, sin tocar la DB ----

  previewUsers(count, { role } = {}) {
    const safeCount = clamp(count, MIN_COUNT, MAX_PREVIEW_COUNT);
    return userFactory.buildUsers(safeCount, { role }).map(sanitizeUser);
  }

  previewOrders(count) {
    const safeCount = clamp(count, MIN_COUNT, MAX_PREVIEW_COUNT);
    // IDs de clientes "de mentira": alcanza para mostrar la forma del pedido
    // sin necesitar usuarios reales en la base.
    const fakeCustomerIds = Array.from({ length: Math.min(safeCount, 5) }, fakeObjectId);
    return orderFactory.buildOrders(safeCount, { customerIds: fakeCustomerIds });
  }

  previewDeliveries(count) {
    const safeCount = clamp(count, MIN_COUNT, MAX_PREVIEW_COUNT);
    const fakeOrders = Array.from({ length: safeCount }, () => ({
      _id: fakeObjectId(),
      status: ORDER_STATUS.PENDING,
    }));
    const fakeDeliveryPersonIds = Array.from({ length: Math.min(safeCount, 3) }, fakeObjectId);
    return deliveryFactory.buildDeliveriesForOrders({
      orders: fakeOrders,
      deliveryPersonIds: fakeDeliveryPersonIds,
    });
  }

  // ---- Endpoint de CARGA: inserta datos de prueba relacionados en MongoDB ----

  async seedDatabase({ usersCount = 10, ordersCount = 10, deliveriesCount = 10 } = {}) {
    const safeUsersCount = clamp(usersCount, MIN_COUNT, MAX_SEED_COUNT);
    const safeOrdersCount = clamp(ordersCount, MIN_COUNT, MAX_SEED_COUNT);
    // Nunca puede haber más entregas que pedidos: la relación es 1 a 1.
    const safeDeliveriesCount = Math.min(clamp(deliveriesCount, MIN_COUNT, MAX_SEED_COUNT), safeOrdersCount);

    // 1) Usuarios: generamos con la distribución de roles de la factory y
    // garantizamos que exista al menos un cliente y un repartidor,
    // para poder armar las relaciones pedido<->usuario y entrega<->repartidor.
    const usersToInsert = userFactory.buildUsers(safeUsersCount);
    const insertedUsers = await userRepository.insertMany(usersToInsert);

    let customers = insertedUsers.filter((user) => user.role !== USER_ROLES.DELIVERY_PERSON);
    let deliveryPeople = insertedUsers.filter((user) => user.role === USER_ROLES.DELIVERY_PERSON);

    if (customers.length === 0) {
      const [extraCustomer] = await userRepository.insertMany([
        userFactory.buildUser({ role: USER_ROLES.USER }),
      ]);
      customers = [extraCustomer];
    }
    if (deliveryPeople.length === 0) {
      const [extraDeliveryPerson] = await userRepository.insertMany([
        userFactory.buildUser({ role: USER_ROLES.DELIVERY_PERSON }),
      ]);
      deliveryPeople = [extraDeliveryPerson];
    }

    // 2) Pedidos: si ya hay productos reales cargados, los usamos para
    // que los items del pedido referencien productos existentes.
    const availableProducts = await productRepository.getAll();
    const customerIds = customers.map((user) => user._id.toString());
    const ordersToInsert = orderFactory.buildOrders(safeOrdersCount, {
      customerIds,
      availableProducts,
    });
    const insertedOrders = await orderRepository.insertMany(ordersToInsert);

    // 3) Entregas: una por cada uno de los primeros N pedidos, asignadas a
    // repartidores reales (rol DELIVERY_PERSON).
    const ordersForDelivery = insertedOrders.slice(0, safeDeliveriesCount);
    const deliveryPersonIds = deliveryPeople.map((user) => user._id.toString());
    const deliveriesToInsert = deliveryFactory.buildDeliveriesForOrders({
      orders: ordersForDelivery,
      deliveryPersonIds,
    });
    const insertedDeliveries = await deliveryRepository.insertMany(deliveriesToInsert);

    return {
      summary: {
        usersCreated: insertedUsers.length,
        ordersCreated: insertedOrders.length,
        deliveriesCreated: insertedDeliveries.length,
        customers: customers.length,
        deliveryPeople: deliveryPeople.length,
      },
      sample: {
        user: insertedUsers[0] ? sanitizeUser(insertedUsers[0].toObject()) : null,
        order: insertedOrders[0] || null,
        delivery: insertedDeliveries[0] || null,
      },
    };
  }
}

module.exports = new MockService();
