const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { uploadUserDocument } = require('../config/multer.config');

const router = Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/register', userController.register);
router.put('/:id', userController.update);
router.post('/:id/documents', uploadUserDocument, userController.uploadDocument);
router.delete('/:id', userController.remove);

module.exports = router;
