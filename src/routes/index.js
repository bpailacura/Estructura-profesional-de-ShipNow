const { Router } = require('express');
const productRoutes = require('./product.routes');
const userRoutes = require('./user.routes');

const router = Router();

router.use('/products', productRoutes);
router.use('/users', userRoutes);

module.exports = router;
