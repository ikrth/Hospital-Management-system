const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { createNotification } = require('../services/notificationService');
const groqService = require('../services/groqService');

exports.createRecord = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, prescription, labTests, notes, attachments } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('patient');
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    if (appointment.status !== 'completed') {
      return sendError(res, 'Can only create records for completed appointments', 400);
    }

    if (appointment.hasRecord) {
      return sendError(res, 'A medical record already exists for this appointment', 400);
    }

    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
      return sendError(res, 'Unauthorized: You are not the assigned doctor', 403);
    }

    const record = await MedicalRecord.create({
      patient: appointment.patient,
      doctor: doctor._id,
      appointment: appointmentId,
      diagnosis,
      prescription,
      labTests,
      notes,
      attachments,
    });

    appointment.hasRecord = true;
    await appointment.save();

    // Notify patient
    await createNotification(
      appointment.patient.user,
      'new_record',
      'Medical Record Available',
      `Dr. ${doctor.user.name} has added your medical record for your appointment on ${new Date(appointment.date).toLocaleDateString()}`,
      record._id,
      'MedicalRecord'
    );

    const populatedRecord = await record.populate([
      { path: 'patient', populate: { path: 'user', select: 'name' } },
      { path: 'doctor', populate: { path: 'user', select: 'name' } },
    ]);

    return sendSuccess(res, populatedRecord, 'Medical record created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    let query = {};

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient) return sendError(res, 'Patient profile not found', 404);
      query.patient = patient._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return sendError(res, 'Doctor profile not found', 404);
      query.doctor = doctor._id;
    }
    // Admin sees all

    const [records, total] = await Promise.all([
      MedicalRecord.find(query)
        .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MedicalRecord.countDocuments(query),
    ]);

    return sendSuccess(res, {
      records,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .populate('appointment');

    if (!record) return sendError(res, 'Record not found', 404);

    // Access check
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (record.patient._id.toString() !== patient._id.toString()) {
        return sendError(res, 'Unauthorized', 403);
      }
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (record.doctor._id.toString() !== doctor._id.toString()) {
        return sendError(res, 'Unauthorized', 403);
      }
    }

    return sendSuccess(res, record);
  } catch (err) {
    next(err);
  }
};

exports.updateRecord = async (req, res, next) => {
  try {
    const { diagnosis, prescription, labTests, notes } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) return sendError(res, 'Record not found', 404);

    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
      return sendError(res, 'Unauthorized', 403);
    }

    // 24 hour restriction
    const diff = Date.now() - record.createdAt.getTime();
    if (diff > 24 * 60 * 60 * 1000) {
      return sendError(res, 'Records can only be updated within 24 hours of creation', 403);
    }

    record.diagnosis = diagnosis || record.diagnosis;
    record.prescription = prescription || record.prescription;
    record.labTests = labTests || record.labTests;
    record.notes = notes || record.notes;

    await record.save();
    return sendSuccess(res, record, 'Record updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return sendError(res, 'Record not found', 404);

    // Only admin can delete
    if (req.user.role !== 'admin') return sendError(res, 'Only admins can delete records', 403);

    // Reset appointment flag
    await Appointment.findByIdAndUpdate(record.appointment, { hasRecord: false });
    await record.deleteOne();

    return sendSuccess(res, null, 'Record deleted');
  } catch (err) {
    next(err);
  }
};

exports.generateAISummary = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return sendError(res, 'Record not found', 404);

    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor || record.doctor.toString() !== doctor._id.toString()) {
      return sendError(res, 'Unauthorized', 403);
    }

    const summary = await groqService.generateDischargeSummary({
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      notes: record.notes,
      labTests: record.labTests
    });

    record.dischargeSummary = summary;
    record.aiGeneratedAt = new Date();
    await record.save();

    return sendSuccess(res, record, 'AI summary generated');
  } catch (err) {
    next(err);
  }
};
