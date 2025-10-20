/**
 * API Module - Handles all backend API calls
 * @module api
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'https://propabridge-api.onrender.com/api/v1'
  : '/api/v1';

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
      body: JSON.stringify({ phone })
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
      body: JSON.stringify({ phone, code })
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
    return !!localStorage.getItem('authToken');
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
   * Upload property images
   * @param {FormData} formData - Form data with images
   * @returns {Promise<object>}
   */
  async uploadImages(formData) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/properties/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    return response.json();
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
      skipAuth: true
    });
  },

  /**
   * Get conversation history
   * @param {string} phone - User phone number
   * @returns {Promise<array>}
   */
  async getHistory(phone) {
    const data = await apiRequest(`/chat/history?phone=${phone}`, {
      skipAuth: true
    });
    return data.history || [];
  }
};

/**
 * Export API module
 */
window.API = {
  auth,
  properties,
  chat
};

