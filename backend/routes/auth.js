const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

router.post(
	'/register',
	validate([
		body('name').trim().notEmpty().withMessage('Name is required'),
		body('email').isEmail().withMessage('Valid email is required'),
		body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
	]),
	authController.register
);

router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.put('/update-password', protect, authController.updatePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
