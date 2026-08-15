const orderService = require('../services/order.service');

class OrderController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const orders = await orderService.getAllOrders({ status });
      return res.status(200).json({ data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      return res.status(200).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(req.body);
      return res.status(201).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
      return res.status(200).json({ data: order });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await orderService.deleteOrder(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
