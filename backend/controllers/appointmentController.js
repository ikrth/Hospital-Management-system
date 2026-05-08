const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { checkSlotAvailability, getPaginationMeta } = require('../services/appointmentLogic');
const { createNotification } = require('../services/notificationService');
const User = require('../models/User');

exports.createAppointment = async (req, res, next) => {
  try {
    const { doctor, patient, date, timeSlot } = req.body;
    if (!doctor || !patient || !date || !timeSlot) {
      return sendError(res, 'Missing required fields', 400);
    }

    // Fetch doctor, patient, and slot availability in parallel
    const [doctorDoc, patientDoc, available] = await Promise.all([
      Doctor.findById(doctor),
      Patient.findById(patient),
      checkSlotAvailability(doctor, date, timeSlot),
    ]);

    if (!doctorDoc) return sendError(res, 'Doctor not found', 404);
    if (!patientDoc) return sendError(res, 'Patient not found', 404);
    if (req.user.role === 'patient' && patientDoc.user.toString() !== req.user.id) {
      return sendError(res, 'Forbidden', 403);
    }
    if (!available) return sendError(res, 'Time slot already booked', 400);

    const appointment = await Appointment.create(req.body);

    // Populate both paths in parallel
    await Promise.all([
      appointment.populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } }),
      appointment.populate({ path: 'patient', populate: { path: 'user', select: 'name email' } }),
    ]);

    // Fire all notifications concurrently
    const notifs = [
      createNotification(doctorDoc.user, 'appointment_confirmed', 'New Appointment', `You have a new appointment on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`, appointment._id, 'Appointment'),
      createNotification(patientDoc.user, 'appointment_confirmed', 'Appointment Confirmed', `Your appointment is confirmed for ${new Date(date).toLocaleDateString()} at ${timeSlot}.`, appointment._id, 'Appointment'),
    ];

    if (['critical', 'high'].includes(appointment.priorityLevel)) {
      logger.warn(`High priority appointment created: ${appointment._id.toString()}`);
      const admins = await User.find({ role: 'admin' }).select('_id');
      admins.forEach((admin) => {
        notifs.push(createNotification(admin._id, 'priority_alert', 'Priority Appointment Booked', `A ${appointment.priorityLevel} priority appointment was booked.`, appointment._id, 'Appointment'));
      });
    }

    await Promise.all(notifs);

    return sendSuccess(res, appointment, 'Appointment created', 201);
  } catch (err) {
    next(err);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priorityLevel) filter.priorityLevel = req.query.priorityLevel;

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return sendSuccess(res, { data: [], meta: getPaginationMeta(0, page, limit) });
      filter.doctor = doctor._id;
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient) return sendSuccess(res, { data: [], meta: getPaginationMeta(0, page, limit) });
      filter.patient = patient._id;
    }

    const [total, appointments] = await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.find(filter)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
        .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } }),
    ]);

    return sendSuccess(res, {
      data: appointments,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email' } });
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || doctor._id.toString() !== appointment.doctor._id.toString()) {
        return sendError(res, 'Forbidden', 403);
      }
    }

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || patient._id.toString() !== appointment.patient._id.toString()) {
        return sendError(res, 'Forbidden', 403);
      }
    }

    return sendSuccess(res, appointment);
  } catch (err) {
    next(err);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes !== undefined) updates.notes = req.body.notes;
    if (req.body.doctor) {
      const doctor = await Doctor.findById(req.body.doctor);
      if (!doctor) return sendError(res, 'Doctor not found', 404);
      updates.doctor = req.body.doctor;
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!appointment) return sendError(res, 'Appointment not found', 404);
    return sendSuccess(res, appointment, 'Appointment updated');
  } catch (err) {
    next(err);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return sendError(res, 'Appointment not found', 404);

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || patient._id.toString() !== appointment.patient.toString()) {
        return sendError(res, 'Forbidden', 403);
      }
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Fetch doctor & patient, then notify both in parallel
    const [doctorDoc, patientDoc] = await Promise.all([
      Doctor.findById(appointment.doctor),
      Patient.findById(appointment.patient),
    ]);

    const dateStr = new Date(appointment.date).toLocaleDateString();
    await Promise.all([
      doctorDoc && createNotification(doctorDoc.user, 'appointment_cancelled', 'Appointment Cancelled', `An appointment on ${dateStr} at ${appointment.timeSlot} was cancelled.`, appointment._id, 'Appointment'),
      patientDoc && createNotification(patientDoc.user, 'appointment_cancelled', 'Appointment Cancelled', `Your appointment on ${dateStr} at ${appointment.timeSlot} was cancelled.`, appointment._id, 'Appointment'),
    ].filter(Boolean));

    return sendSuccess(res, appointment, 'Appointment cancelled');
  } catch (err) {
    next(err);
  }
};
