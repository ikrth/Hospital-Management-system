const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', userController.getUsers);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
