const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(protect);

router.get('/admin', restrictTo('admin', 'receptionist'), analyticsController.getAdminStats);
router.get('/doctor', restrictTo('doctor'), analyticsController.getDoctorStats);

module.exports = router;
