const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');
const { uploadDeliveryProof } = require('../config/multer.config');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);
router.post('/', deliveryController.create);
router.put('/:id/status', deliveryController.updateStatus);
router.post('/:id/proof', uploadDeliveryProof, deliveryController.uploadProof);
router.delete('/:id', deliveryController.remove);

module.exports = router;
