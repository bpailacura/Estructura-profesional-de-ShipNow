const { Router } = require('express');
const loggerController = require('../controllers/logger.controller');

const router = Router();

// GET /api/logger/test -> dispara un log de cada nivel (debug..fatal)
router.get('/test', loggerController.test);

module.exports = router;
