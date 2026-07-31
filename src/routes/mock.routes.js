const { Router } = require('express');
const mockController = require('../controllers/mock.controller');

const router = Router();

// Previsualización: generan datos simulados SIN guardarlos en la base.
router.get('/users', mockController.getUsers);
router.get('/orders', mockController.getOrders);
router.get('/deliveries', mockController.getDeliveries);

// Carga controlada: generan e insertan datos relacionados en MongoDB.
router.post('/seed', mockController.seed);

module.exports = router;
