const express = require('express');
const router = express.Router();
const { createDoctor, getDoctors } = require('../controllers/doctor');
const { protect } = require('../middleware/auth');

router.post('/', protect, createDoctor);
router.get('/', protect, getDoctors);

module.exports = router;
