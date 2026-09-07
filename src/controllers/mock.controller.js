const mockService = require('../mocks/mock.service');

class MockController {
  // GET /api/mocks/users?count=10&role=DELIVERY_PERSON
  async getUsers(req, res, next) {
    try {
      const { count = 10, role } = req.query;
      const users = await mockService.previewUsers(count, { role });
      return res.status(200).json({ data: users });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mocks/orders?count=10
  getOrders(req, res, next) {
    try {
      const { count = 10 } = req.query;
      const orders = mockService.previewOrders(count);
      return res.status(200).json({ data: orders });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mocks/deliveries?count=10
  getDeliveries(req, res, next) {
    try {
      const { count = 10 } = req.query;
      const deliveries = mockService.previewDeliveries(count);
      return res.status(200).json({ data: deliveries });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/mocks/seed  { "usersCount": 10, "ordersCount": 10, "deliveriesCount": 10 }
  async seed(req, res, next) {
    try {
      const { usersCount, ordersCount, deliveriesCount } = req.body || {};
      const result = await mockService.seedDatabase({ usersCount, ordersCount, deliveriesCount });
      return res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MockController();
