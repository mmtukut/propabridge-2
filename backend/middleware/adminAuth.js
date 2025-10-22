const authService = require('../services/authService');

/**
 * Admin Authentication Middleware
 * Verifies that the user is authenticated and has admin role
 * Accepts both regular user tokens (with admin role) and admin tokens
 */
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin authentication required.'
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if this is an admin token (role: 'admin')
    if (payload.role === 'admin') {
      req.adminUser = {
        id: payload.userId,
        phone: payload.phone,
        role: 'admin'
      };
      return next();
    }

    // Check if this is a regular user with admin role
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Add user info to request object
    req.adminUser = user;
    next();

  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional Admin Authentication Middleware
 * Same as requireAdmin but doesn't fail if no token provided
 */
const optionalAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without admin access
      req.adminUser = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);

    if (!payload) {
      req.adminUser = null;
      return next();
    }

    // Get user from database to check role
    const user = await authService.getUserById(payload.userId);

    if (!user || user.role !== 'admin') {
      req.adminUser = null;
      return next();
    }

    // User is admin
    req.adminUser = user;
    next();

  } catch (error) {
    console.error('Optional admin authentication error:', error);
    req.adminUser = null;
    next();
  }
};

module.exports = {
  requireAdmin,
  optionalAdmin
};
