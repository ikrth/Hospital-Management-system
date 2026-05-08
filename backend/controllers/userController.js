const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
    if (req.query.q) {
      filter.$or = [
        { name: new RegExp(req.query.q, 'i') },
        { email: new RegExp(req.query.q, 'i') },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    ]);

    return sendSuccess(res, {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return sendError(res, 'User not found', 404);
    
    // Prevent self-demotion or deactivation
    if (user._id.toString() === req.user.id && (role === 'doctor' || role === 'patient' || isActive === false)) {
      return sendError(res, 'Cannot demote or deactivate yourself', 403);
    }

    user.name = name || user.name;
    user.role = role || user.role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    return sendSuccess(res, user, 'User updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (user._id.toString() === req.user.id) return sendError(res, 'Cannot delete yourself', 403);

    await user.deleteOne();
    return sendSuccess(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
};
