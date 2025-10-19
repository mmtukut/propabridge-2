const { query } = require('../config/db');
const crypto = require('crypto');

/**
 * Authentication Service for Phone-Based OTP
 * Handles user registration, OTP generation, verification, and JWT token generation
 */

/**
 * Generate a random 6-digit OTP code
 * @returns {string} - 6-digit OTP code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to user's phone number
 * In production, integrate with SMS provider (Twilio, Africa's Talking, Termii)
 * For now, we log it to console
 * @param {string} phone - User's phone number
 * @returns {Promise<object>} - OTP details
 */
const sendOTP = async (phone) => {
  try {
    // Validate phone number format
    const phoneRegex = /^\+234\d{10}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format. Use +234XXXXXXXXXX');
    }

    // Generate OTP code
    const code = generateOTP();
    
    // Set expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Clean up any existing unverified OTPs for this phone
    await query(
      'DELETE FROM otp_codes WHERE phone = $1 AND verified = false',
      [phone]
    );

    // Store OTP in database
    const result = await query(
      `INSERT INTO otp_codes (phone, code, expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING id, phone, expires_at`,
      [phone, code, expiresAt]
    );

    // TODO: In production, send SMS via provider
    // Example for Twilio:
    // await twilioClient.messages.create({
    //   body: `Your Propabridge verification code is: ${code}. Valid for 5 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    // For development: Log OTP to console
    console.log(`🔐 OTP for ${phone}: ${code} (expires in 5 minutes)`);

    return {
      success: true,
      message: 'OTP sent successfully',
      otpId: result.rows[0].id,
      expiresAt: result.rows[0].expires_at,
      // Remove this in production - only for dev/testing
      _devOTP: process.env.NODE_ENV === 'development' ? code : undefined
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP code for a phone number
 * @param {string} phone - User's phone number
 * @param {string} code - 6-digit OTP code
 * @returns {Promise<object>} - User data and token
 */
const verifyOTP = async (phone, code) => {
  try {
    // Find valid OTP
    const otpResult = await query(
      `SELECT * FROM otp_codes 
       WHERE phone = $1 AND code = $2 AND verified = false AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phone, code]
    );

    if (otpResult.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid or expired OTP code'
      };
    }

    // Mark OTP as verified
    await query(
      'UPDATE otp_codes SET verified = true WHERE id = $1',
      [otpResult.rows[0].id]
    );

    // Find or create user
    let userResult = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await query(
        `INSERT INTO users (phone, verified, last_active) 
         VALUES ($1, true, NOW()) 
         RETURNING *`,
        [phone]
      );
      user = newUserResult.rows[0];
      console.log(`✅ New user created: ${phone}`);
    } else {
      // Update existing user
      const updateResult = await query(
        `UPDATE users 
         SET verified = true, last_active = NOW() 
         WHERE phone = $1 
         RETURNING *`,
        [phone]
      );
      user = updateResult.rows[0];
      console.log(`✅ Existing user verified: ${phone}`);
    }

    // Generate JWT token (simple implementation - enhance with actual JWT library in production)
    const token = generateToken(user);

    return {
      success: true,
      message: 'Phone verified successfully',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        verified: user.verified
      },
      token
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Generate a simple authentication token
 * In production, use a proper JWT library like jsonwebtoken
 * @param {object} user - User object
 * @returns {string} - Authentication token
 */
const generateToken = (user) => {
  // Simple token for now - in production, use JWT
  // Example with jsonwebtoken:
  // const jwt = require('jsonwebtoken');
  // return jwt.sign(
  //   { userId: user.id, phone: user.phone, role: user.role },
  //   process.env.JWT_SECRET,
  //   { expiresIn: '30d' }
  // );
  
  const payload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
    exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  
  // Base64 encode (NOT SECURE - use JWT in production)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

/**
 * Verify authentication token
 * @param {string} token - Authentication token
 * @returns {object|null} - Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    // In production, use JWT verify
    // const jwt = require('jsonwebtoken');
    // return jwt.verify(token, process.env.JWT_SECRET);
    
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    // Check if token expired
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Refresh authentication token
 * @param {string} oldToken - Current authentication token
 * @returns {Promise<object>} - New token
 */
const refreshToken = async (oldToken) => {
  try {
    const payload = verifyToken(oldToken);
    
    if (!payload) {
      throw new Error('Invalid or expired token');
    }

    // Get latest user data
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    const newToken = generateToken(user);

    return {
      success: true,
      token: newToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} - User object or null
 */
const getUserById = async (userId) => {
  try {
    const result = await query(
      'SELECT id, phone, name, email, role, verified, created_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {object} updates - Fields to update (name, email)
 * @returns {Promise<object>} - Updated user object
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const allowedFields = ['name', 'email'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const result = await query(
      `UPDATE users 
       SET ${fields.join(', ')}, last_active = NOW() 
       WHERE id = $${paramCount} 
       RETURNING id, phone, name, email, role, verified`,
      values
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Cleanup expired OTPs (should be run periodically via cron job)
 * @returns {Promise<number>} - Number of deleted OTPs
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await query(
      'DELETE FROM otp_codes WHERE expires_at < NOW() RETURNING id'
    );
    console.log(`🧹 Cleaned up ${result.rowCount} expired OTPs`);
    return result.rowCount;
  } catch (error) {
    console.error('Error cleaning up OTPs:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  generateToken,
  verifyToken,
  refreshToken,
  getUserById,
  updateUserProfile,
  cleanupExpiredOTPs
};

