const Appointment = require('../models/Appointment');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const { sendSuccess } = require('../utils/responseHelper');

exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRecords,
      statusDistribution,
      priorityDistribution,
      monthlyAppointments,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Appointment.countDocuments(),
      MedicalRecord.countDocuments(),
      
      // Status Distribution
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Priority Distribution
      Appointment.aggregate([
        { $group: { _id: '$priorityLevel', count: { $sum: 1 } } }
      ]),

      // Monthly Appointments (Last 6 months)
      Appointment.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
          }
        },
        {
          $group: {
            _id: { 
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    return sendSuccess(res, {
      summary: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalRecords,
      },
      statusDistribution,
      priorityDistribution,
      monthlyAppointments,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorStats = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return sendError(res, 'Doctor not found', 404);

    const [
      totalAppointments,
      totalRecords,
      upcomingAppointments,
      statusDistribution,
    ] = await Promise.all([
      Appointment.countDocuments({ doctor: doctor._id }),
      MedicalRecord.countDocuments({ doctor: doctor._id }),
      Appointment.countDocuments({ 
        doctor: doctor._id, 
        date: { $gte: new Date() },
        status: 'confirmed'
      }),
      Appointment.aggregate([
        { $match: { doctor: doctor._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    return sendSuccess(res, {
      totalAppointments,
      totalRecords,
      upcomingAppointments,
      statusDistribution,
    });
  } catch (err) {
    next(err);
  }
};
