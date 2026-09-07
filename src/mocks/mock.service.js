const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const orderRepository = require('../repositories/order.repository');
const deliveryRepository = require('../repositories/delivery.repository');
const productRepository = require('../repositories/product.repository');
const { USER_ROLES, ORDER_STATUS } = require('../constants');
const userFactory = require('./factories/user.factory');
const orderFactory = require('./factories/order.factory');
const deliveryFactory = require('./factories/delivery.factory');
const { parseCount } = require('./mock.validation');
const { DatabaseError } = require('../errors/domainErrors');
const logger = require('../config/logger.config');

// Límites de seguridad para no permitir cargas descontroladas a la base
// ("de forma controlada" según la consigna).
const MIN_COUNT = 1;
const MAX_PREVIEW_COUNT = 50;
const MAX_SEED_COUNT = 50;

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

  async previewUsers(count, { role } = {}) {
    const safeCount = parseCount(count, { min: MIN_COUNT, max: MAX_PREVIEW_COUNT, fieldName: 'count' });
    const users = await userFactory.buildUsers(safeCount, { role });
    return users.map(sanitizeUser);
  }

  previewOrders(count) {
    const safeCount = parseCount(count, { min: MIN_COUNT, max: MAX_PREVIEW_COUNT, fieldName: 'count' });
    // IDs de clientes "de mentira": alcanza para mostrar la forma del pedido
    // sin necesitar usuarios reales en la base.
    const fakeCustomerIds = Array.from({ length: Math.min(safeCount, 5) }, fakeObjectId);
    return orderFactory.buildOrders(safeCount, { customerIds: fakeCustomerIds });
  }

  previewDeliveries(count) {
    const safeCount = parseCount(count, { min: MIN_COUNT, max: MAX_PREVIEW_COUNT, fieldName: 'count' });
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

  async seedDatabase({ usersCount, ordersCount, deliveriesCount } = {}) {
    const safeUsersCount = parseCount(usersCount, { min: MIN_COUNT, max: MAX_SEED_COUNT, fieldName: 'usersCount' });
    const safeOrdersCount = parseCount(ordersCount, { min: MIN_COUNT, max: MAX_SEED_COUNT, fieldName: 'ordersCount' });
    const requestedDeliveriesCount = parseCount(deliveriesCount, {
      min: MIN_COUNT,
      max: MAX_SEED_COUNT,
      fieldName: 'deliveriesCount',
    });
    // Nunca puede haber más entregas que pedidos: la relación es 1 a 1.
    const safeDeliveriesCount = Math.min(requestedDeliveriesCount, safeOrdersCount);

    logger.info(
      `Generando datos de prueba: usuarios=${safeUsersCount}, pedidos=${safeOrdersCount}, entregas=${safeDeliveriesCount}`
    );

    try {
      // 1) Usuarios: generamos con la distribución de roles de la factory y
      // garantizamos que el LOTE incluya al menos un cliente y un repartidor
      // ANTES de insertar (forzando el rol de algún usuario ya generado, en
      // vez de insertar usuarios de más). Así "usersCreated" en la respuesta
      // siempre coincide con la cantidad real que queda en la base, sin
      // importar cómo haya salido el sorteo de roles.
      const usersToInsert = await userFactory.buildUsers(safeUsersCount);

      const hasDeliveryPerson = usersToInsert.some((user) => user.role === USER_ROLES.DELIVERY_PERSON);
      const hasCustomer = usersToInsert.some((user) => user.role !== USER_ROLES.DELIVERY_PERSON);

      if (!hasDeliveryPerson) {
        usersToInsert[0].role = USER_ROLES.DELIVERY_PERSON;
      }
      // Con usersCount === 1 no se pueden garantizar los dos roles al mismo
      // tiempo en el mismo lote: priorizamos el repartidor (arriba) y
      // dejamos que el fallback de abajo cubra el cliente si hace falta.
      if (!hasCustomer && usersToInsert.length > 1) {
        usersToInsert[1].role = USER_ROLES.USER;
      }

      const insertedUsers = await userRepository.insertMany(usersToInsert);
      // Acumula TODO lo insertado (incluyendo los extras del fallback de
      // abajo) para que el conteo y la muestra reportados sean honestos.
      const allInsertedUsers = [...insertedUsers];

      let customers = insertedUsers.filter((user) => user.role !== USER_ROLES.DELIVERY_PERSON);
      let deliveryPeople = insertedUsers.filter((user) => user.role === USER_ROLES.DELIVERY_PERSON);

      // Fallback: solo puede hacer falta cuando usersCount === 1 (el
      // forzado de roles de arriba ya cubre cualquier caso con 2 o más).
      if (customers.length === 0) {
        const [extraCustomer] = await userRepository.insertMany([
          await userFactory.buildUser({ role: USER_ROLES.USER }),
        ]);
        customers = [extraCustomer];
        allInsertedUsers.push(extraCustomer);
      }
      if (deliveryPeople.length === 0) {
        const [extraDeliveryPerson] = await userRepository.insertMany([
          await userFactory.buildUser({ role: USER_ROLES.DELIVERY_PERSON }),
        ]);
        deliveryPeople = [extraDeliveryPerson];
        allInsertedUsers.push(extraDeliveryPerson);
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

      logger.info(
        `Datos de prueba insertados: ${allInsertedUsers.length} usuarios, ${insertedOrders.length} pedidos, ${insertedDeliveries.length} entregas`
      );

      return {
        summary: {
          usersCreated: allInsertedUsers.length,
          ordersCreated: insertedOrders.length,
          deliveriesCreated: insertedDeliveries.length,
          customers: customers.length,
          deliveryPeople: deliveryPeople.length,
        },
        sample: {
          user: allInsertedUsers[0] ? sanitizeUser(allInsertedUsers[0].toObject()) : null,
          order: insertedOrders[0] || null,
          delivery: insertedDeliveries[0] || null,
        },
      };
    } catch (error) {
      // Si el error ya es uno nuestro (ej: validación), lo dejamos pasar tal cual;
      // el middleware global se encarga de loguearlo como advertencia.
      if (error.statusCode) {
        throw error;
      }
      // Cualquier falla real de Mongo/Mongoose durante la carga (conexión,
      // validación de schema, índice único, etc.) se traduce a un error
      // de dominio controlado, en vez de tirar el stack de Mongo crudo.
      logger.error(`Falló el seed de mocks: ${error.message}`);
      throw new DatabaseError('MOCK_SEED_FAILURE', {
        details: { reason: error.message },
      });
    }
  }
}

module.exports = new MockService();
