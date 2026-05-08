const groqService = require('../services/groqService');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Patient = require('../models/Patient');
const TherapySession = require('../models/TherapySession');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { calculatePriorityScore } = require('../services/priorityEngine');

// ─── Triage ─────────────────────────────────────────────────────────────────

exports.triage = async (req, res, next) => {
  try {
    const { symptoms, patientAge, patientGender } = req.body;
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return sendError(res, 'Symptoms must be a non-empty array', 422);
    }

    const triage = await groqService.triageSymptoms(symptoms, patientAge, patientGender);
    const score = calculatePriorityScore(symptoms, triage.priorityScore || 0, patientAge || 0);

    const doctors = await Doctor.find({
      specialization: triage.recommendedSpecialty,
      isAvailable: true,
    }).populate('user', 'name email');

    return sendSuccess(res, {
      ...triage,
      priorityLevel: score.priorityLevel,
      priorityScore: score.adjustedScore,
      boosted: score.boosted,
      matchingDoctors: doctors,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Therapist Chat ──────────────────────────────────────────────────────────

exports.therapist = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return sendError(res, 'Message is required', 422);

    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) return sendError(res, 'Patient profile not found', 404);

    // Resolve or create session
    let session;
    if (sessionId) {
      session = await TherapySession.findOne({ _id: sessionId, patient: patient._id });
    }
    if (!session) {
      session = await TherapySession.create({ patient: patient._id, messages: [] });
    }

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: message });

    const user = await User.findById(req.user.id).lean();
    const firstName = user?.name?.split(' ')[0] || 'there';

    const reply = await groqService.therapistChat(history, firstName);

    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: reply });

    // Mood analysis every 3 assistant messages
    if (session.messages.length % 6 === 0) {
      const analysis = await groqService.analyzeMood(session.messages.slice(-6));
      session.dominantMood = analysis.primaryEmotion;
      session.riskLevel = analysis.riskLevel;
    }

    await session.save();

    return sendSuccess(res, { reply, sessionId: session._id, session });
  } catch (err) {
    next(err);
  }
};

// ─── Session Management ──────────────────────────────────────────────────────

exports.getTherapySessions = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });
    if (!patient) return sendError(res, 'Patient not found', 404);

    const sessions = await TherapySession.find({ patient: patient._id }).sort({ updatedAt: -1 });
    return sendSuccess(res, sessions);
  } catch (err) {
    next(err);
  }
};

exports.getTherapySessionById = async (req, res, next) => {
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) return sendError(res, 'Session not found', 404);
    return sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
};

// ─── AI Health Check ─────────────────────────────────────────────────────────

exports.health = async (req, res, next) => {
  try {
    const status = await groqService.checkHealth();
    return sendSuccess(res, status);
  } catch (err) {
    next(err);
  }
};

// ─── Discharge Summary ───────────────────────────────────────────────────────

exports.dischargeSummary = async (req, res, next) => {
  try {
    const { recordData } = req.body;
    if (!recordData) return sendError(res, 'Record data is required', 400);
    const summary = await groqService.generateDischargeSummary(recordData);
    return sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
};

// ─── Mood Analysis ───────────────────────────────────────────────────────────

exports.moodAnalysis = async (req, res, next) => {
  try {
    const { conversationHistory } = req.body;
    if (!conversationHistory) return sendError(res, 'Conversation history is required', 400);
    const analysis = await groqService.analyzeMood(conversationHistory);
    return sendSuccess(res, analysis);
  } catch (err) {
    next(err);
  }
};

// ─── Follow-up Suggestions ───────────────────────────────────────────────────

exports.suggestFollowUps = async (req, res, next) => {
  try {
    const { diagnosis, notes } = req.body;
    if (!diagnosis) return sendError(res, 'Diagnosis is required', 400);
    const suggestions = await groqService.suggestFollowUps(diagnosis, notes || '');
    return sendSuccess(res, { suggestions });
  } catch (err) {
    next(err);
  }
};

// ─── Save Therapy Session ────────────────────────────────────────────────────

exports.saveTherapySession = async (req, res, next) => {
  try {
    const { conversationHistory, moodScore } = req.body;

    if (!conversationHistory || conversationHistory.length < 2) {
      return sendError(res, 'Session too short to save', 400);
    }

    // Extract AI messages for summary & theme detection
    const aiMessages = conversationHistory
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join(' ');

    const themeKeywords = {
      anxiety: ['anxiety', 'anxious', 'worried', 'ghabra'],
      depression: ['sad', 'udas', 'depressed', 'hopeless'],
      stress: ['stress', 'pressure', 'overwhelmed', 'pareshan'],
      sleep: ['sleep', 'neend', 'insomnia', 'rest'],
      family: ['family', 'ghar', 'parents', 'والدین'],
      work: ['work', 'kaam', 'job', 'career'],
    };

    const themes = Object.entries(themeKeywords)
      .filter(([, kws]) => kws.some((k) => aiMessages.toLowerCase().includes(k)))
      .map(([theme]) => theme);

    const patient = await Patient.findOne({ user: req.user._id || req.user.id });
    if (!patient) return sendError(res, 'Patient not found', 404);

    await TherapySession.create({
      patient: patient._id,
      messageCount: conversationHistory.length,
      summary: aiMessages.substring(0, 500),
      moodScore: moodScore || 5,
      keyThemes: themes,
      crisisDetected: conversationHistory.some(
        (m) =>
          m.content?.toLowerCase().includes('988') ||
          m.content?.toLowerCase().includes('crisis')
      ),
    });

    return sendSuccess(res, { saved: true }, 'Session saved successfully');
  } catch (err) {
    next(err);
  }
};
