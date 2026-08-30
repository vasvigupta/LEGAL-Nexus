const { verifyAccessToken } = require('../services/authService');
const { User } = require('../models');
const { sendError } = require('../utils/apiResponse');

const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication required. Invalid token format.', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 'User associated with this token no longer exists.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'User account is deactivated.', 403);
    }

    if (user.isBlocked) {
      return sendError(
        res,
        `Your account has been blocked by Platform Administration. Reason: ${user.blockedReason || 'Fraudulent or unverified profile activity.'}`,
        403
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token has expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid or malformed token.', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = {
  authenticateJWT,
  optionalAuth,
};
