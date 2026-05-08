const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

router.get('/', protect, doctorController.getAllDoctors);
router.post('/', protect, restrictTo('admin'), doctorController.createDoctor);
router.get('/:id', protect, doctorController.getDoctorById);
router.patch('/:id', protect, doctorController.updateDoctor);
router.patch('/:id/slots', protect, doctorController.updateDoctorSlots);
router.delete('/:id', protect, restrictTo('admin'), doctorController.deleteDoctor);
router.get('/:id/slots', protect, doctorController.getDoctorSlots);

module.exports = router;
