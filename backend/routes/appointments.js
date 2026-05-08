const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

router.post('/', protect, appointmentController.createAppointment);
router.get('/', protect, appointmentController.getAppointments);
router.get('/:id', protect, appointmentController.getAppointmentById);
router.put('/:id', protect, restrictTo('admin', 'doctor', 'receptionist'), appointmentController.updateAppointment);
router.put('/:id/cancel', protect, appointmentController.cancelAppointment);

module.exports = router;
