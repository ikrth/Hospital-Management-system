const mongoose = require('mongoose');
const logger = require('../utils/logger.js');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Notification = require('../models/Notification');

const WEEK_SLOTS = [
  { day: 'monday',    startTime: '09:00', endTime: '17:00' },
  { day: 'tuesday',   startTime: '09:00', endTime: '17:00' },
  { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
  { day: 'thursday',  startTime: '09:00', endTime: '17:00' },
  { day: 'friday',    startTime: '09:00', endTime: '17:00' },
];

const DOCTORS = [
  { name: 'Dr. Ahmed Khan',      email: 'dr.ahmed@hospital.com',      specialization: 'Cardiology',          experience: 12, fee: 2000, license: 'LIC-CARD-001' },
  { name: 'Dr. Sarah Ali',       email: 'dr.sarah@hospital.com',      specialization: 'Psychiatry',          experience: 8,  fee: 2500, license: 'LIC-PSY-002'  },
  { name: 'Dr. Usman Malik',     email: 'dr.usman@hospital.com',      specialization: 'General Medicine',    experience: 15, fee: 1500, license: 'LIC-GEN-003'  },
  { name: 'Dr. Nadia Hussain',   email: 'dr.nadia@hospital.com',      specialization: 'Neurology',           experience: 10, fee: 3000, license: 'LIC-NEU-004'  },
  { name: 'Dr. Tariq Mahmood',   email: 'dr.tariq@hospital.com',      specialization: 'Orthopedics',         experience: 14, fee: 2800, license: 'LIC-ORT-005'  },
  { name: 'Dr. Ayesha Siddiqui', email: 'dr.ayesha@hospital.com',     specialization: 'Gynecology',          experience: 11, fee: 2200, license: 'LIC-GYN-006'  },
  { name: 'Dr. Bilal Chaudhry',  email: 'dr.bilal@hospital.com',      specialization: 'Pediatrics',          experience: 9,  fee: 1800, license: 'LIC-PED-007'  },
  { name: 'Dr. Farah Qureshi',   email: 'dr.farah@hospital.com',      specialization: 'Dermatology',         experience: 7,  fee: 2000, license: 'LIC-DER-008'  },
  { name: 'Dr. Kamran Sheikh',   email: 'dr.kamran@hospital.com',     specialization: 'Gastroenterology',    experience: 13, fee: 2700, license: 'LIC-GAS-009'  },
  { name: 'Dr. Lubna Raza',      email: 'dr.lubna@hospital.com',      specialization: 'Endocrinology',       experience: 10, fee: 2600, license: 'LIC-END-010'  },
  { name: 'Dr. Omar Farooq',     email: 'dr.omar@hospital.com',       specialization: 'Ophthalmology',       experience: 8,  fee: 2100, license: 'LIC-OPH-011'  },
  { name: 'Dr. Hina Baig',       email: 'dr.hina@hospital.com',       specialization: 'ENT',                 experience: 9,  fee: 1900, license: 'LIC-ENT-012'  },
  { name: 'Dr. Asad Mehmood',    email: 'dr.asad@hospital.com',       specialization: 'Pulmonology',         experience: 11, fee: 2400, license: 'LIC-PUL-013'  },
  { name: 'Dr. Sana Iqbal',      email: 'dr.sana@hospital.com',       specialization: 'Nephrology',          experience: 12, fee: 2900, license: 'LIC-NEP-014'  },
  { name: 'Dr. Zubair Khalid',   email: 'dr.zubair@hospital.com',     specialization: 'Urology',             experience: 10, fee: 2500, license: 'LIC-URO-015'  },
  { name: 'Dr. Maryam Aslam',    email: 'dr.maryam@hospital.com',     specialization: 'Rheumatology',        experience: 8,  fee: 2300, license: 'LIC-RHE-016'  },
  { name: 'Dr. Imran Javed',     email: 'dr.imran@hospital.com',      specialization: 'Oncology',            experience: 15, fee: 3500, license: 'LIC-ONC-017'  },
  { name: 'Dr. Rabia Nadeem',    email: 'dr.rabia@hospital.com',      specialization: 'Hematology',          experience: 9,  fee: 2600, license: 'LIC-HEM-018'  },
  { name: 'Dr. Faisal Awan',     email: 'dr.faisal@hospital.com',     specialization: 'Emergency Medicine',  experience: 7,  fee: 2000, license: 'LIC-EM-019'   },
  { name: 'Dr. Amna Butt',       email: 'dr.amna@hospital.com',       specialization: 'Radiology',           experience: 10, fee: 2200, license: 'LIC-RAD-020'  },
];

async function seedDatabase() {
  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ── Admin ────────────────────────────────────────────────────────────────────
    await User.create({ name: 'Admin User', email: 'admin@hospital.com', password: 'Admin@123', role: 'admin' });

    // ── Receptionist ─────────────────────────────────────────────────────────────
    await User.create({ name: 'Fatima Zahra', email: 'reception@hospital.com', password: 'Reception@123', role: 'receptionist' });

    // ── Doctors ──────────────────────────────────────────────────────────────────
    const doctorUsers = await User.create(
      DOCTORS.map((d) => ({ name: d.name, email: d.email, password: 'Doctor@123', role: 'doctor' }))
    );

    const doctorProfiles = await Doctor.create(
      DOCTORS.map((d, i) => ({
        user: doctorUsers[i]._id,
        specialization: d.specialization,
        experience: d.experience,
        licenseNumber: d.license,
        consultationFee: d.fee,
        isAvailable: true,
        availableSlots: WEEK_SLOTS,
      }))
    );

    // ── Patients ─────────────────────────────────────────────────────────────────
    const patientUsers = await User.create([
      { name: 'Ali Hassan',   email: 'ali@patient.com',   password: 'Patient@123', role: 'patient' },
      { name: 'Zara Ahmed',   email: 'zara@patient.com',  password: 'Patient@123', role: 'patient' },
      { name: 'Bilal Khan',   email: 'bilal@patient.com', password: 'Patient@123', role: 'patient' },
    ]);

    const patientProfiles = await Patient.create([
      { user: patientUsers[0]._id, dateOfBirth: new Date('1990-05-15'), gender: 'male',   bloodGroup: 'O+', phone: '03001234567' },
      { user: patientUsers[1]._id, dateOfBirth: new Date('1995-08-22'), gender: 'female', bloodGroup: 'A+', phone: '03009876543' },
      { user: patientUsers[2]._id, dateOfBirth: new Date('1988-12-10'), gender: 'male',   bloodGroup: 'B+', phone: '03005555555' },
    ]);

    // ── Sample Appointments ───────────────────────────────────────────────────────
    const d = (offsetDays) => { const dt = new Date(); dt.setDate(dt.getDate() + offsetDays); return dt; };

    const appts = await Appointment.create([
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[0]._id, date: d(1),  timeSlot: '09:00', status: 'confirmed', type: 'specialist', priorityLevel: 'high',   symptoms: ['chest pain', 'shortness of breath'] },
      { patient: patientProfiles[1]._id, doctor: doctorProfiles[1]._id, date: d(2),  timeSlot: '10:00', status: 'pending',   type: 'therapy',    priorityLevel: 'medium', symptoms: ['anxiety', 'stress', 'sleep issues'] },
      { patient: patientProfiles[2]._id, doctor: doctorProfiles[2]._id, date: d(-1), timeSlot: '08:00', status: 'completed', type: 'general',    priorityLevel: 'low',    symptoms: ['fever', 'headache'] },
      { patient: patientProfiles[0]._id, doctor: doctorProfiles[1]._id, date: d(5),  timeSlot: '11:00', status: 'pending',   type: 'therapy',    priorityLevel: 'medium', symptoms: ['depression', 'loneliness'] },
      { patient: patientProfiles[1]._id, doctor: doctorProfiles[2]._id, date: d(1),  timeSlot: '12:00', status: 'confirmed', type: 'general',    priorityLevel: 'critical', symptoms: ['severe abdominal pain', 'vomiting'] },
    ]);

    // ── Medical Records ───────────────────────────────────────────────────────────
    await MedicalRecord.create([{
      patient: patientProfiles[2]._id,
      doctor: doctorProfiles[2]._id,
      appointment: appts[2]._id,
      diagnosis: 'Viral fever with tension headache',
      prescription: [
        { medicine: 'Paracetamol', dosage: '500mg', duration: '5 days', frequency: 'TDS' },
        { medicine: 'Brufen',      dosage: '400mg', duration: '3 days', frequency: 'BD'  },
      ],
      labTests: ['CBC', 'ESR'],
      notes: 'Patient advised rest and increased fluid intake',
    }]);

    // ── Summary ───────────────────────────────────────────────────────────────────
    logger.info('='.repeat(50));
    logger.info('SEED COMPLETED — ' + DOCTORS.length + ' doctors across all specialties');
    logger.info('='.repeat(50));
    logger.info('CREDENTIALS:');
    logger.info('Admin:       admin@hospital.com       / Admin@123');
    logger.info('Reception:   reception@hospital.com   / Reception@123');
    logger.info('All Doctors: dr.ahmed@hospital.com (etc) / Doctor@123');
    logger.info('Patient 1:   ali@patient.com          / Patient@123');
    logger.info('Patient 2:   zara@patient.com         / Patient@123');
    logger.info('Patient 3:   bilal@patient.com        / Patient@123');
    logger.info('='.repeat(50));
    logger.info('Specialties seeded:');
    DOCTORS.forEach((d) => logger.info(`  ${d.specialization} — ${d.name}`));
    logger.info('='.repeat(50));

    return true;
  } catch (error) {
    logger.error('Seed failed: ' + error.message);
    throw error;
  }
}

module.exports = { seedDatabase };

if (require.main === module) {
  const connectDB = require('../config/db.js');
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  }).catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
