const express = require('express');
const router = express.Router();
const { createPatient, getPatients } = require('../controllers/patient');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPatient);
router.get('/', protect, getPatients);

module.exports = router;
