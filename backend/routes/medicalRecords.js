const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const medicalRecordController = require('../controllers/medicalRecordController');

router.use(protect);

router.post('/', restrictTo('doctor'), medicalRecordController.createRecord);
router.get('/', medicalRecordController.getRecords);
router.get('/:id', medicalRecordController.getRecordById);
router.post('/:id/generate-ai-summary', restrictTo('doctor'), medicalRecordController.generateAISummary);
router.patch('/:id', restrictTo('doctor'), medicalRecordController.updateRecord);
router.delete('/:id', restrictTo('admin'), medicalRecordController.deleteRecord);

module.exports = router;
