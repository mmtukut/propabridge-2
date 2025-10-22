/**
 * API Module - Handles all backend API calls
 * @module api
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api/v1'
  : 'https://propabridge-api.onrender.com/api/v1';

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - API response
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('authToken');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Authentication API
 */
const auth = {
  /**
   * Send OTP to phone number
   * @param {string} phone - Phone number (+234XXXXXXXXXX)
   * @returns {Promise<object>}
   */
  async sendOTP(phone) {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      skipAuth: true
    });
  },

  /**
   * Verify OTP code
   * @param {string} phone - Phone number
   * @param {string} code - OTP code
   * @returns {Promise<object>}
   */
  async verifyOTP(phone, code) {
    const result = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      skipAuth: true
    });

    if (result.success && result.token) {
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  },

  /**
   * Get current user profile
   * @returns {Promise<object>}
   */
  async getProfile() {
    return apiRequest('/auth/me');
  },

  /**
   * Update user profile
   * @param {object} updates - Fields to update
   * @returns {Promise<object>}
   */
  async updateProfile(updates) {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Refresh authentication token
   * @param {string} token - Current token
   * @returns {Promise<object>}
   */
  async refreshToken(token) {
    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
      skipAuth: true
    });
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    // Check if token is still valid (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        // Token expired
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      this.logout();
      return false;
    }
  },

  /**
   * Get current user from localStorage
   * @returns {object|null}
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

/**
 * Properties API
 */
const properties = {
  /**
   * Search properties with criteria
   * @param {object} criteria - Search criteria
   * @returns {Promise<array>}
   */
  async search(criteria) {
    const params = new URLSearchParams();
    if (criteria.location) params.append('location', criteria.location);
    if (criteria.maxPrice) params.append('maxPrice', criteria.maxPrice);
    if (criteria.minPrice) params.append('minPrice', criteria.minPrice);
    if (criteria.bedrooms) params.append('bedrooms', criteria.bedrooms);
    if (criteria.propertyType) params.append('propertyType', criteria.propertyType);

    const data = await apiRequest(`/properties/search?${params.toString()}`);
    return data.properties || [];
  },

  /**
   * Get property by ID
   * @param {number} id - Property ID
   * @returns {Promise<object>}
   */
  async getById(id) {
    const data = await apiRequest(`/properties/${id}`);
    return data.property;
  },

  /**
   * Create new property listing
   * @param {object} propertyData - Property data
   * @returns {Promise<object>}
   */
  async create(propertyData) {
    return apiRequest('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  },

  /**
   * Upload property images to Cloudinary
   * @param {FormData} formData - Form data with images and propertyId
   * @returns {Promise<object>}
   */
  async uploadImages(formData) {
    console.log('Uploading images to Cloudinary...');

    // Use the real backend Cloudinary integration
    return apiRequest('/properties/images', {
      method: 'POST',
      body: formData
      // Note: FormData automatically handles content-type and boundaries
      // Authentication will be handled by the apiRequest function
    });
  },

  /**
   * Track property view
   * @param {number} propertyId - Property ID
   * @returns {Promise<void>}
   */
  async trackView(propertyId) {
    try {
      await apiRequest(`/properties/${propertyId}/view`, {
        method: 'POST',
        skipAuth: !auth.isAuthenticated()
      });
    } catch (error) {
      console.error('Failed to track view:', error);
      // Non-critical, don't throw
    }
  }
};

/**
 * WhatsApp/Chat API
 */
const chat = {
  /**
   * Send message to AI bot
   * @param {string} message - User message
   * @param {string} phone - User phone number
   * @returns {Promise<object>}
   */
  async sendMessage(message, phone) {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, phone }),
      skipAuth: true // Chat is public but tracks user phone
    });
  },

  /**
   * Get conversation history
   * @param {string} phone - User phone number
   * @returns {Promise<array>}
   */
  async getHistory(phone) {
    const data = await apiRequest(`/chat/history?phone=${phone}`, {
      skipAuth: true // Chat history is public for the phone number
    });
    return data.history || [];
  }
};

/**
 * Admin API
 */
const admin = {
  /**
   * Get admin statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    const adminToken = localStorage.getItem('adminToken');
    return apiRequest('/properties/admin/stats', {
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
  },

  /**
   * Get pending properties for approval
   * @returns {Promise<array>}
   */
  async getPendingProperties() {
    const adminToken = localStorage.getItem('adminToken');
    return apiRequest('/properties/admin/pending', {
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
  },

  /**
   * Approve a property
   * @param {number} propertyId - Property ID
   * @param {string} notes - Admin notes
   * @returns {Promise<object>}
   */
  async approveProperty(propertyId, notes = '') {
    const adminToken = localStorage.getItem('adminToken');
    return apiRequest(`/properties/${propertyId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes: notes }),
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
  },

  /**
   * Reject a property
   * @param {number} propertyId - Property ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<object>}
   */
  async rejectProperty(propertyId, reason) {
    const adminToken = localStorage.getItem('adminToken');
    return apiRequest(`/properties/${propertyId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
  },

  /**
   * Login as admin using regular user authentication
   * Admin users are regular users with admin role
   * @param {string} phone - Admin phone number
   * @param {string} password - Admin password (not used for OTP)
   * @returns {Promise<object>}
   */
  async adminLogin(phone, password) {
    try {
      // Clean phone number for admin login (same logic as regular auth)
      const cleanPhone = phone.replace(/\s/g, '');
      let apiPhone = cleanPhone;

      // Convert to API format (+234XXXXXXXXXX)
      if (cleanPhone.startsWith('0')) {
        apiPhone = '+234' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('234')) {
        apiPhone = '+' + cleanPhone;
      } else if (cleanPhone.startsWith('+234')) {
        apiPhone = cleanPhone;
      }

      // For demo: Check if phone matches admin phone or password is admin123
      if (apiPhone === '+2348055269579' || password === 'admin123') {
        // Generate admin token
        const payload = {
          userId: 'admin',
          phone: apiPhone,
          role: 'admin',
          exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };

        const token = Buffer.from(JSON.stringify(payload)).toString('base64');
        localStorage.setItem('adminToken', token);

        return {
          success: true,
          token,
          admin: { phone: apiPhone, role: 'admin' }
        };
      }

      return {
        success: false,
        message: 'Admin access denied. Use admin phone number (+2348055269579) with password "admin123"'
      };

    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: 'Admin login failed'
      };
    }
  },

  /**
   * Check if admin is logged in
   * @returns {boolean}
   */
  isAdminLoggedIn() {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return payload.role === 'admin' && payload.exp > Date.now();
    } catch (error) {
      return false;
    }
  },

  /**
   * Admin logout
   */
  adminLogout() {
    localStorage.removeItem('adminToken');
  }
};

/**
 * Export API module
 */
window.API = {
  auth,
  properties,
  admin,
  chat
};

