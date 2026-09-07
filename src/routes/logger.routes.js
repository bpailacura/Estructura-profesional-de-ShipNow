const { Router } = require('express');
const loggerController = require('../controllers/logger.controller');
const blockInProduction = require('../middlewares/blockInProduction.middleware');

const router = Router();

// Endpoint interno de desarrollo/QA: bloqueado en producción (ver
// blockInProduction.middleware.js).
router.use(blockInProduction);

// GET /api/logger/test -> dispara un log de cada nivel (debug..fatal)
router.get('/test', loggerController.test);

module.exports = router;
