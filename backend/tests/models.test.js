const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

let mongoServer;

describe('Model validation and persistence', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('creates and saves each model', async () => {
    const patientUser = await User.create({
      name: 'Pat User',
      email: 'patient@example.com',
      password: 'secret123',
      role: 'patient',
    });

    const doctorUser = await User.create({
      name: 'Doc User',
      email: 'doctor@example.com',
      password: 'secret123',
      role: 'doctor',
    });

    const patient = await Patient.create({
      user: patientUser._id,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      bloodGroup: 'O+',
      phone: '555-1000',
      address: { city: 'Metro', street: 'Main St', zip: '12345' },
      emergencyContact: { name: 'Jane', phone: '555-2000', relation: 'spouse' },
      medicalHistory: ['asthma'],
      allergies: ['pollen'],
      insurance: { provider: 'Acme', policyNumber: 'POL123' },
    });

    const doctor = await Doctor.create({
      user: doctorUser._id,
      specialization: 'Cardiology',
      qualifications: ['MD'],
      experience: 10,
      licenseNumber: 'LIC123',
      consultationFee: 120,
      availableSlots: [
        { day: 'monday', startTime: '09:00', endTime: '12:00' },
      ],
      rating: 4.2,
      isAvailable: true,
    });

    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      date: new Date('2026-06-01'),
      timeSlot: '09:00-09:30',
      type: 'general',
      status: 'confirmed',
      symptoms: ['cough'],
      aiSuggestedSpecialty: 'Pulmonology',
      aiPriorityScore: 6,
      priorityLevel: 'medium',
      notes: 'Initial visit',
      createdBy: doctorUser._id,
    });

    const record = await MedicalRecord.create({
      patient: patient._id,
      appointment: appointment._id,
      doctor: doctor._id,
      diagnosis: 'Common cold',
      prescription: [{ medicine: 'MedA', dosage: '1 tab', duration: '5 days' }],
      labTests: ['CBC'],
      notes: 'Rest and fluids',
      attachments: ['files/report.pdf'],
    });

    expect(patient._id).toBeDefined();
    expect(doctor._id).toBeDefined();
    expect(appointment._id).toBeDefined();
    expect(record._id).toBeDefined();
  });

  it('hashes user password and compares correctly', async () => {
    const user = await User.create({
      name: 'Hash User',
      email: 'hash@example.com',
      password: 'secret123',
      role: 'patient',
    });

    expect(user.password).not.toBe('secret123');
    const isMatch = await user.comparePassword('secret123');
    expect(isMatch).toBe(true);
  });
});
