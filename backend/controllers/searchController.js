const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { sendSuccess } = require('../utils/responseHelper');

exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return sendSuccess(res, { results: [] });

    const regex = new RegExp(q, 'i');
    const results = [];

    // Search Patients (if staff)
    if (['admin', 'doctor', 'receptionist'].includes(req.user.role)) {
      const patients = await User.find({ 
        role: 'patient',
        $or: [{ name: regex }, { email: regex }] 
      }).limit(5).lean();
      
      patients.forEach(p => results.push({ 
        id: p._id, 
        type: 'Patient', 
        title: p.name, 
        subtitle: p.email,
        link: `/patients` // Ideally to a detail page if implemented
      }));
    }

    // Search Doctors
    const doctors = await User.find({ 
      role: 'doctor',
      name: regex 
    }).limit(5).lean();

    for (const d of doctors) {
      const doctorProfile = await Doctor.findOne({ user: d._id });
      results.push({ 
        id: d._id, 
        type: 'Doctor', 
        title: d.name, 
        subtitle: doctorProfile?.specialty || 'General Practitioner',
        link: '/doctors'
      });
    }

    // Search Medical Records
    let recordQuery = { diagnosis: regex };
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (patient) recordQuery.patient = patient._id;
      else recordQuery = null; // No records if no patient profile
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (doctor) recordQuery.doctor = doctor._id;
      // Staff might want to see all? Depends on req. Admin sees all.
    }

    if (recordQuery) {
      const records = await MedicalRecord.find(recordQuery).limit(5).lean();
      records.forEach(r => results.push({
        id: r._id,
        type: 'Medical Record',
        title: r.diagnosis,
        subtitle: new Date(r.createdAt).toLocaleDateString(),
        link: `/records/${r._id}`
      }));
    }

    return sendSuccess(res, { results });
  } catch (err) {
    next(err);
  }
};
