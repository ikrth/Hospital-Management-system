const jwt = require('jsonwebtoken');

const sendSuccess = (res, data, message, statusCode = 200) => {
	return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message, statusCode = 400) => {
	return res.status(statusCode).json({ success: false, message });
};

const sendToken = (res, user, statusCode = 200) => {
	const payload = { id: user._id, role: user.role };
	const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
		expiresIn: process.env.JWT_EXPIRE || '7d',
	});

	const userObj = user.toObject ? user.toObject() : { ...user };
	delete userObj.password;

	return res.status(statusCode).json({ success: true, token, user: userObj });
};

module.exports = { sendSuccess, sendError, sendToken };
