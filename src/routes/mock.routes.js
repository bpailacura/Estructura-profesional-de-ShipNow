const { Router } = require('express');
const mockController = require('../controllers/mock.controller');
const blockInProduction = require('../middlewares/blockInProduction.middleware');

const router = Router();

// Endpoint interno de desarrollo/QA: bloqueado en producción (ver
// blockInProduction.middleware.js).
router.use(blockInProduction);

// Previsualización: generan datos simulados SIN guardarlos en la base.
router.get('/users', mockController.getUsers);
router.get('/orders', mockController.getOrders);
router.get('/deliveries', mockController.getDeliveries);

// Carga controlada: generan e insertan datos relacionados en MongoDB.
router.post('/seed', mockController.seed);

module.exports = router;
