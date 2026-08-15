const { Router } = require('express');
const orderController = require('../controllers/order.controller');

const router = Router();

router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', orderController.create);
router.put('/:id/status', orderController.updateStatus);
router.delete('/:id', orderController.remove);

module.exports = router;
