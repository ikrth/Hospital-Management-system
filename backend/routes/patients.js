const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

router.get('/', protect, restrictTo('admin', 'receptionist', 'doctor'), patientController.getAllPatients);
router.post('/', protect, restrictTo('admin', 'receptionist'), patientController.createPatient);
router.get('/me', protect, restrictTo('patient', 'admin', 'receptionist'), patientController.getMyProfile);
router.get('/:id', protect, patientController.getPatientById);
router.put('/:id', protect, patientController.updatePatient);
router.delete('/:id', protect, restrictTo('admin'), patientController.deletePatient);
router.get('/:id/appointments', protect, patientController.getPatientAppointments);

module.exports = router;
