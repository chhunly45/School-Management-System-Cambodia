const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let token = null;

  if (typeof authHeader === 'string') {
    const headerValue = authHeader.trim();
    const parts = headerValue.split(' ').filter(Boolean);
    if (parts.length > 1 && parts[0].toLowerCase() === 'bearer') {
      token = parts.slice(1).join(' ').trim();
    } else if (parts.length === 1) {
      token = parts[0];
    }
  }

  if (!token && req.cookies) {
    token = req.cookies.authToken || req.cookies.accessToken || req.cookies.token || req.cookies.jwt || null;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const user = await User.findById(payload.userId).select('-passwordHash -refreshTokens');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
