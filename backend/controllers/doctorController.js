const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const {
  checkSlotAvailability,
  generateTimeSlots,
  getPaginationMeta,
} = require('../services/appointmentLogic');

exports.getAllDoctors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.specialization) filter.specialization = req.query.specialization;
    if (req.query.isAvailable !== undefined) {
      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    return sendSuccess(res, {
      data: doctors,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email role isActive');
    if (!doctor) return sendError(res, 'Doctor not found', 404);
    return sendSuccess(res, doctor);
  } catch (err) {
    next(err);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    const { user, specialization } = req.body;
    if (!user || !specialization) return sendError(res, 'User and specialization are required', 400);

    const userDoc = await User.findById(user);
    if (!userDoc) return sendError(res, 'User not found', 404);

    userDoc.role = 'doctor';
    await userDoc.save();

    const doctor = await Doctor.create(req.body);
    return sendSuccess(res, doctor, 'Doctor created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const isAdmin = req.user.role === 'admin';
    const isSelf = doctor.user.toString() === req.user.id;
    if (!isAdmin && !isSelf) return sendError(res, 'Forbidden', 403);

    Object.assign(doctor, req.body);
    await doctor.save();

    return sendSuccess(res, doctor, 'Doctor updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const user = await User.findById(doctor.user);
    if (user) {
      user.isActive = false;
      await user.save();
    }

    doctor.isAvailable = false;
    await doctor.save();

    return sendSuccess(res, doctor, 'Doctor deactivated');
  } catch (err) {
    next(err);
  }
};

exports.getDoctorSlots = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return sendError(res, 'Date is required', 400);

    const doctor = await Doctor.findById(id);
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const slots = generateTimeSlots(doctor.availableSlots || [], date);

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: id,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    }).select('timeSlot');

    const bookedSlots = new Set(booked.map((b) => b.timeSlot));
    const available = slots.filter((s) => !bookedSlots.has(s));

    return sendSuccess(res, { date, slots: available });
  } catch (err) {
    next(err);
  }
};

exports.updateDoctorSlots = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const isAuthorized = ['admin', 'receptionist'].includes(req.user.role);
    const isSelf = doctor.user.toString() === req.user.id;
    if (!isAuthorized && !isSelf) return sendError(res, 'Forbidden', 403);

    doctor.availableSlots = req.body.availableSlots;
    await doctor.save();

    return sendSuccess(res, doctor, 'Schedule updated');
  } catch (err) {
    next(err);
  }
};
