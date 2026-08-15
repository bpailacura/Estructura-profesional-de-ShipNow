const { Router } = require('express');
const productRoutes = require('./product.routes');
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes');
const deliveryRoutes = require('./delivery.routes');
const mockRoutes = require('./mock.routes');
const loggerRoutes = require('./logger.routes');

const router = Router();

router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/mocks', mockRoutes);
router.use('/logger', loggerRoutes);

module.exports = router;
