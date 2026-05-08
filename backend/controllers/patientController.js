const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { getPaginationMeta } = require('../services/appointmentLogic');

exports.getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    // If doctor: only show their own patients
    if (req.user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      const Appointment = require('../models/Appointment');
      const doctorDoc = await Doctor.findOne({ user: req.user.id });
      if (!doctorDoc) return sendSuccess(res, { data: [], meta: getPaginationMeta(0, page, limit) });

      const appointments = await Appointment.find({ doctor: doctorDoc._id }).distinct('patient');
      let patientFilter = { _id: { $in: appointments } };

      if (search) {
        const users = await User.find({
          $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }]
        }).select('_id');
        const userIds = users.map((u) => u._id);
        patientFilter.user = { $in: userIds };
      }

      const [total, patients] = await Promise.all([
        Patient.countDocuments(patientFilter),
        Patient.find(patientFilter).skip(skip).limit(limit).populate('user', 'name email role isActive'),
      ]);
      return sendSuccess(res, { data: patients, meta: getPaginationMeta(total, page, limit) });
    }

    let userFilter = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      userFilter = { $or: [{ name: regex }, { email: regex }] };
    }

    const users = await User.find(userFilter).select('_id');
    const userIds = users.map((u) => u._id);

    if (search && userIds.length === 0) {
      return sendSuccess(res, { data: [], meta: getPaginationMeta(0, page, limit) });
    }

    const patientFilter = userIds.length ? { user: { $in: userIds } } : {};

    const [total, patients] = await Promise.all([
      Patient.countDocuments(patientFilter),
      Patient.find(patientFilter)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role isActive'),
    ]);

    return sendSuccess(res, {
      data: patients,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('user', 'name email role isActive');
    if (!patient) return sendError(res, 'Patient not found', 404);

    const isAdmin = ['admin', 'receptionist'].includes(req.user.role);
    const isSelf = patient.user._id.toString() === req.user.id;

    if (!isAdmin && !isSelf) return sendError(res, 'Forbidden', 403);

    return sendSuccess(res, patient);
  } catch (err) {
    next(err);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const { user } = req.body;
    if (!user) return sendError(res, 'User is required', 400);

    const userDoc = await User.findById(user);
    if (!userDoc) return sendError(res, 'User not found', 404);

    const existing = await Patient.findOne({ user });
    if (existing) return sendError(res, 'Patient already exists', 400);

    userDoc.role = 'patient';
    await userDoc.save();

    const patient = await Patient.create(req.body);
    return sendSuccess(res, patient, 'Patient created', 201);
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return sendError(res, 'Patient not found', 404);

    const isAdmin = req.user.role === 'admin';
    const isSelf = patient.user.toString() === req.user.id;

    if (!isAdmin && !isSelf) return sendError(res, 'Forbidden', 403);

    Object.assign(patient, req.body);
    await patient.save();

    return sendSuccess(res, patient, 'Patient updated');
  } catch (err) {
    next(err);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).populate('user', 'name email role isActive');
    if (!patient) return sendError(res, 'Patient not found', 404);
    return sendSuccess(res, patient);
  } catch (err) {
    next(err);
  }
};

exports.getPatientAppointments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const patient = await Patient.findById(req.params.id);
    if (!patient) return sendError(res, 'Patient not found', 404);

    const isAdmin = ['admin', 'receptionist'].includes(req.user.role);
    const isSelf = patient.user.toString() === req.user.id;
    if (!isAdmin && !isSelf) return sendError(res, 'Forbidden', 403);

    const total = await Appointment.countDocuments({ patient: patient._id });
    const appointments = await Appointment.find({ patient: patient._id })
      .skip(skip)
      .limit(limit)
      .populate('doctor', 'specialization')
      .populate('patient', 'user');

    return sendSuccess(res, {
      data: appointments,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return sendError(res, 'Patient not found', 404);

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) return sendError(res, 'Forbidden', 403);

    await Patient.findByIdAndDelete(req.params.id);
    
    // Optionally delete User if desired, but we'll leave it for now
    // await User.findByIdAndDelete(patient.user);

    return sendSuccess(res, null, 'Patient deleted successfully');
  } catch (err) {
    next(err);
  }
};
