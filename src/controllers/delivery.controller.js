const deliveryService = require('../services/delivery.service');

class DeliveryController {
  async getAll(req, res, next) {
    try {
      const { status } = req.query;
      const deliveries = await deliveryService.getAllDeliveries({ status });
      return res.status(200).json({ data: deliveries });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      return res.status(200).json({ data: delivery });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const delivery = await deliveryService.createDelivery(req.body);
      return res.status(201).json({ data: delivery });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const delivery = await deliveryService.updateDeliveryStatus(req.params.id, req.body.status);
      return res.status(200).json({ data: delivery });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await deliveryService.deleteDelivery(req.params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeliveryController();
