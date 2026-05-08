const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

let app;
let mongoServer;

const createUserPayload = (role, email) => ({
  name: `${role} user`,
  email,
  password: 'secret123',
  role,
});

describe('Appointment routes', () => {
  jest.setTimeout(30000);

  const waitForConnection = async () => {
    if (mongoose.connection.readyState === 1) return;
    await new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (mongoose.connection.readyState === 1) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - start > 15000) {
          clearInterval(timer);
          reject(new Error('Mongoose connection timeout'));
        }
      }, 100);
    });
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_EXPIRE = '1d';
    app = require('../server');
    await waitForConnection();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await waitForConnection();
    await mongoose.connection.dropDatabase();
  });

  it('creates and manages appointments as patient', async () => {
    const admin = await User.create(createUserPayload('admin', 'admin@example.com'));
    const doctorUser = await User.create(createUserPayload('doctor', 'doctor@example.com'));
    const patientUser = await User.create(createUserPayload('patient', 'patient@example.com'));

    const doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiology',
      availableSlots: [{ day: 'monday', startTime: '09:00', endTime: '12:00' }],
      isAvailable: true,
    });

    const patient = await Patient.create({ user: patientUser._id });

    const registerRes = await request(app).post('/api/v1/auth/login').send({
      email: 'patient@example.com',
      password: 'secret123',
    });

    const token = registerRes.body.token;
    const date = new Date('2026-06-02T00:00:00.000Z');

    const createRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient: patient._id,
        doctor: doctor._id,
        date,
        timeSlot: '09:00',
        type: 'general',
        priorityLevel: 'medium',
      });

    expect(createRes.statusCode).toBe(201);

    const duplicateRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patient: patient._id,
        doctor: doctor._id,
        date,
        timeSlot: '09:00',
        type: 'general',
        priorityLevel: 'medium',
      });

    expect(duplicateRes.statusCode).toBe(400);

    const listRes = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.data.length).toBe(1);

    const appointmentId = listRes.body.data.data[0]._id;
    const cancelRes = await request(app)
      .put(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');
  });
});
