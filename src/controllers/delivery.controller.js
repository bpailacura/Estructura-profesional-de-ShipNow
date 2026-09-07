const deliveryService = require('../services/delivery.service');

class DeliveryController {
  async getAll(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const { data, meta } = await deliveryService.getAllDeliveries({ status, page, limit });
      return res.status(200).json({ data, meta });
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

  // POST /deliveries/:id/proof (multipart/form-data)
  // El archivo llega en req.file (middleware uploadDeliveryProof ya corrió antes).
  async uploadProof(req, res, next) {
    try {
      const delivery = await deliveryService.addDeliveryProof(req.params.id, req.file, req.body.documentType);
      return res.status(201).json({ data: delivery });
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
