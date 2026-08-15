const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');

const router = Router();

router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getById);
router.post('/', deliveryController.create);
router.put('/:id/status', deliveryController.updateStatus);
router.delete('/:id', deliveryController.remove);

module.exports = router;
