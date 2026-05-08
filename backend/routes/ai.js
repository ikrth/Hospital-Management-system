const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/triage', protect, restrictTo('patient', 'receptionist'), aiController.triage);
router.post('/therapist', protect, restrictTo('patient'), aiController.therapist);
router.get('/therapy/sessions', protect, aiController.getTherapySessions);
router.get('/therapy/sessions/:id', protect, aiController.getTherapySessionById);
router.post('/discharge-summary', protect, restrictTo('doctor', 'admin'), aiController.dischargeSummary);
router.post('/analyze-mood', protect, restrictTo('patient', 'doctor', 'admin'), aiController.moodAnalysis);
router.post('/suggest-followups', protect, restrictTo('doctor'), aiController.suggestFollowUps);
router.post('/save-therapy-session', protect, restrictTo('patient'), aiController.saveTherapySession);
router.get('/health', aiController.health);

module.exports = router;
