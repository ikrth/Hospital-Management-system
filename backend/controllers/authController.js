const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { sendToken, sendSuccess, sendError } = require('../utils/responseHelper');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) return sendError(res, 'Email already in use', 400);

    const user = await User.create({ name, email, password, role });

    if ((user.role || 'patient') === 'patient') {
      await Patient.create({ user: user._id });
    }

    return sendToken(res, user, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return sendError(res, 'Invalid credentials', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid credentials', 401);

    return sendToken(res, user, 200);
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return sendError(res, 'Unauthorized', 401);

    const user = await User.findById(req.user.id).lean();
    if (!user) return sendError(res, 'User not found', 404);

    delete user.password;

    const patient = await Patient.findOne({ user: user._id }).lean();
    const doctor = await Doctor.findOne({ user: user._id }).lean();

    return sendSuccess(res, { user, patient, doctor }, 'User profile');
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return sendError(res, 'Missing fields', 400);

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 'Current password incorrect', 401);

    user.password = newPassword;
    await user.save();

    return sendToken(res, user, 200);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always send generic message for security
    if (!user) return sendSuccess(res, null, 'Email sent');

    const token = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Hospital MS <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please click: ${resetUrl}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return sendSuccess(res, null, 'Email sent');
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return sendError(res, 'Email failed to send', 500);
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return sendError(res, 'Invalid or expired token', 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendToken(res, user, 200);
  } catch (err) {
    next(err);
  }
};
