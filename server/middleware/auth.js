const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'careerpath_secret_key_2026_jwt');

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or account deleted.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        isBlocked: true,
        message: `Your account has been suspended. Reason: ${user.blockReason || 'Terms violation. Please contact administration.'}`,
      });
    }

    if (user.status === 'paused') {
      return res.status(403).json({
        success: false,
        isPaused: true,
        message: 'Your account is temporarily paused. Please contact administration.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privilege required.' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Student portal only.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireStudent,
};
