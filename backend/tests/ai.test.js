const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { calculatePriorityScore } = require('../services/priorityEngine');

jest.mock('../services/groqService', () => ({
  triageSymptoms: jest.fn(),
  therapistChat: jest.fn(),
  analyzeMood: jest.fn().mockResolvedValue({ primaryEmotion: 'Neutral', riskLevel: 'low', clinicalNotes: '' }),
  checkHealth: jest.fn().mockResolvedValue({ isOnline: true, provider: 'Groq' }),
}));

const groqService = require('../services/groqService');

let app;
let mongoServer;

const signToken = (user) => {
  return jwt.sign({ id: user._id.toString(), role: user.role }, 'testsecret', { expiresIn: '1d' });
};

describe('AI routes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRE = '1d';
    app = require('../server');
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('open', resolve);
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    groqService.triageSymptoms.mockReset();
    groqService.therapistChat.mockReset();
  });

  it('triage returns a valid object', async () => {
    const patientUser = await User.create({
      name: 'Patient One',
      email: 'patient@ai.test',
      password: 'secret123',
      role: 'patient',
    });

    await Doctor.create({
      user: patientUser._id,
      specialization: 'Cardiology',
      isAvailable: true,
    });

    groqService.triageSymptoms.mockResolvedValue({
      recommendedSpecialty: 'Cardiology',
      appointmentType: 'emergency',
      priorityLevel: 'high',
      priorityScore: 9,
      reasoning: 'High risk symptoms.',
      urgencyMessage: 'Seek care immediately.',
      suggestedDoctors: ['Cardiology'],
      redFlags: ['chest pain'],
    });

    const token = signToken(patientUser);

    const res = await request(app)
      .post('/api/v1/ai/triage')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptoms: ['chest pain', 'shortness of breath'], patientAge: 55, patientGender: 'male' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.recommendedSpecialty).toBe('Cardiology');
    expect(res.body.data.appointmentType).toBe('emergency');
    expect(res.body.data.priorityLevel).toBeDefined();
    expect(res.body.data.priorityScore).toBeDefined();
    expect(res.body.data.reasoning).toBeDefined();
    expect(res.body.data.urgencyMessage).toBeDefined();
    expect(res.body.data.suggestedDoctors).toBeDefined();
    expect(res.body.data.redFlags).toBeDefined();
  });

  it('triage rejects empty symptoms', async () => {
    const patientUser = await User.create({
      name: 'Patient Two',
      email: 'patient2@ai.test',
      password: 'secret123',
      role: 'patient',
    });
    const token = signToken(patientUser);

    const res = await request(app)
      .post('/api/v1/ai/triage')
      .set('Authorization', `Bearer ${token}`)
      .send({ symptoms: [], patientAge: 55, patientGender: 'male' });

    expect(res.statusCode).toBe(422);
  });

  it('therapist returns a reply', async () => {
    const patientUser = await User.create({
      name: 'Patient Three',
      email: 'patient3@ai.test',
      password: 'secret123',
      role: 'patient',
    });
    
    const Patient = require('../models/Patient');
    await Patient.create({
      user: patientUser._id,
      gender: 'other',
      dateOfBirth: new Date('1990-01-01')
    });

    groqService.therapistChat.mockResolvedValue('I hear you.');

    const token = signToken(patientUser);

    const res = await request(app)
      .post('/api/v1/ai/therapist')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'I feel anxious', conversationHistory: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.reply).toBeDefined();
  });

  it('priority engine boosts by age', async () => {
    const result = calculatePriorityScore(['symptom'], 7, 75);
    expect(result.priorityLevel).toBe('critical');
  });
});
