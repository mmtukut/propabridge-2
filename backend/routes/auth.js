const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to user's phone number
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await authService.sendOTP(phone);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /send-otp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and return user token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required'
      });
    }

    const result = await authService.verifyOTP(phone, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /verify-otp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await authService.refreshToken(token);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /refresh:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Failed to refresh token'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
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

    const user = await authService.getUserById(payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error in /me:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user profile'
    });
  }
});

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
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

    const { name, email } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await authService.updateUserProfile(payload.userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error in /profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

module.exports = router;

