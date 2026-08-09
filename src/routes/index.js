const { Router } = require('express');
const productRoutes = require('./product.routes');
const userRoutes = require('./user.routes');
const mockRoutes = require('./mock.routes');
const loggerRoutes = require('./logger.routes');

const router = Router();

router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/mocks', mockRoutes);
router.use('/logger', loggerRoutes);

module.exports = router;
