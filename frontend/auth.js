/**
 * Authentication Module - OTP-based phone verification
 * @module auth
 */

// ===================================
// AUTH STATE
// ===================================

const AuthState = {
  currentPhone: '',
  isLoading: false,
  isAuthenticated: false,
  user: null
};

// ===================================
// AUTH FUNCTIONS
// ===================================

/**
 * Initialize authentication flow - Smart authentication routing
 */
function initializeAuth() {
  console.log('Initializing authentication...');

  // Check if user is already authenticated
  if (isAuthenticated()) {
    console.log('User already authenticated, redirecting to home...');
    showScreen('home');
    updateUIForAuthenticatedUser();
    return;
  }

  // Check if this is a returning user (has visited before)
  const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
  const lastVisit = localStorage.getItem('lastVisit');

  if (hasVisitedBefore && lastVisit) {
    const daysSinceLastVisit = (Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24);

    // If user visited within last 7 days, go straight to home (they can authenticate later)
    if (daysSinceLastVisit < 7) {
      console.log('Returning user, allowing access without authentication...');
      showScreen('home');
      markVisit();
      return;
    }
  }

  // New user or long-time returning user - require authentication
  console.log('New user or long-time returner, requiring authentication...');
  showScreen('auth');
  markVisit();
}

/**
 * Mark user visit for smart authentication
 */
function markVisit() {
  localStorage.setItem('hasVisitedBefore', 'true');
  localStorage.setItem('lastVisit', Date.now().toString());
}

/**
 * Skip authentication and go to home (for browsing)
 */
function skipAuthentication() {
  console.log('User chose to browse without authentication...');
  showScreen('home');
  markVisit();

  // Show a subtle reminder about authentication benefits
  setTimeout(() => {
    const notification = document.createElement('div');
    notification.className = 'info-notification';
    notification.innerHTML = `
      <svg class="icon icon-sm icon-primary" viewBox="0 0 24 24">
        <use href="#icon-verified"></use>
      </svg>
      <div>
        <strong>Get personalized matches!</strong><br>
        Verify your phone for AI-powered property recommendations.
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }, 2000);
}

// Validate Nigerian phone number - flexible format support
function validateNigerianPhone(phone) {
  // Remove spaces for validation
  const cleanPhone = phone.replace(/\s/g, '');

  // Valid formats:
  // +2348056419040 (international with plus)
  // 2348056419040 (international without plus)
  // 08056419040 (local format)
  // 8056419040 (without area code)

  const patterns = [
    /^\+234[0-9]{10}$/,    // +234XXXXXXXXXX
    /^234[0-9]{10}$/,      // 234XXXXXXXXXX
    /^0[0-9]{10}$/,        // 0XXXXXXXXXX
    /^[0-9]{10}$/          // XXXXXXXXXX (less common but valid)
  ];

  return patterns.some(pattern => pattern.test(cleanPhone));
}

/**
 * Send OTP to phone number
 */

async function sendOTP() {
  const phoneInput = document.getElementById('authPhone');
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!phone) {
    showError('Please enter your phone number');
    return;
  }

  // Clean phone number for API (remove spaces and ensure +234 format)
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

  // Validate phone format (flexible validation)
  if (!validateNigerianPhone(phone)) {
    showError('Please enter a valid Nigerian phone number. Examples: +234 805 641 9040, 0805 641 9040, or 234 805 641 9040');
    return;
  }

  try {
    AuthState.isLoading = true;
    updateOTPButton('Sending...', true);

    console.log('Sending OTP to:', apiPhone);
    const response = await API.auth.sendOTP(apiPhone);

    if (response.success) {
      AuthState.currentPhone = apiPhone;
      showOTPStep();
      showSuccess('Verification code sent to your WhatsApp!');

      // Auto-focus OTP input
      setTimeout(() => {
        const otpInput = document.getElementById('otpCode');
        if (otpInput) otpInput.focus();
      }, 500);
    } else {
      showError(response.message || 'Failed to send verification code');
    }

    AuthState.isLoading = false;
    updateOTPButton('Send Verification Code', false);

  } catch (error) {
    console.error('Error sending OTP:', error);
    showError('Failed to send verification code. Please try again.');
    AuthState.isLoading = false;
    updateOTPButton('Send Verification Code', false);
  }
}

/**
 * Verify OTP code
 */
async function verifyOTP() {
  const otpInput = document.getElementById('otpCode');
  const code = otpInput ? otpInput.value.trim() : '';

  if (!code) {
    showError('Please enter the verification code');
    return;
  }

  if (code.length !== 6) {
    showError('Verification code must be 6 digits');
    return;
  }

  try {
    AuthState.isLoading = true;
    updateVerifyButton('Verifying...', true);

    console.log('Verifying OTP:', code, 'for phone:', AuthState.currentPhone);
    const response = await API.auth.verifyOTP(AuthState.currentPhone, code);

    if (response.success && response.token) {
      // Save authentication data
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      AuthState.isAuthenticated = true;
      AuthState.user = response.user;

      showSuccess('Phone verified successfully!');
      updateUIForAuthenticatedUser();

      // Redirect to home after a short delay
      setTimeout(() => {
        showScreen('home');
      }, 1500);
    } else {
      showError(response.message || 'Invalid verification code');
    }

    AuthState.isLoading = false;
    updateVerifyButton('Verify & Continue', false);

  } catch (error) {
    console.error('Error verifying OTP:', error);
    showError('Failed to verify code. Please try again.');
    AuthState.isLoading = false;
    updateVerifyButton('Verify & Continue', false);
  }
}

/**
 * Resend OTP code
 */
async function resendOTP() {
  if (!AuthState.currentPhone) {
    showError('No phone number found. Please go back and try again.');
    return;
  }

  try {
    updateResendButton('Sending...', true);

    const response = await API.auth.sendOTP(AuthState.currentPhone);

    if (response.success) {
      showSuccess('Verification code resent!');
    } else {
      showError(response.message || 'Failed to resend code');
    }

    updateResendButton('Resend', false);

  } catch (error) {
    console.error('Error resending OTP:', error);
    showError('Failed to resend verification code');
    updateResendButton('Resend', false);
  }
}

/**
 * Show OTP step
 */
function showOTPStep() {
  document.getElementById('phoneStep').style.display = 'none';
  document.getElementById('otpStep').style.display = 'block';

  // Update form title
  const title = document.querySelector('#otpStep .section-title span');
  if (title) {
    title.textContent = `Verify ${AuthState.currentPhone}`;
  }
}

/**
 * Show phone step
 */
function showPhoneStep() {
  document.getElementById('otpStep').style.display = 'none';
  document.getElementById('phoneStep').style.display = 'block';
  AuthState.currentPhone = '';
}

/**
 * Update UI for authenticated user
 */
function updateUIForAuthenticatedUser() {
  const user = AuthState.user || getCurrentUser();

  if (user) {
    // Update phone input with user's number
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
      phoneInput.value = user.phone;
    }

    // Update contact phone in listing form
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
      contactPhone.value = user.phone;
    }

    console.log('UI updated for authenticated user:', user.phone);
  }
}

/**
 * Update OTP send button
 */
function updateOTPButton(text, disabled) {
  const btn = document.getElementById('sendOTPBtn');
  if (btn) {
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
  }
}

/**
 * Update OTP verify button
 */
function updateVerifyButton(text, disabled) {
  const btn = document.getElementById('verifyOTPBtn');
  if (btn) {
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
  }
}

/**
 * Update resend button
 */
function updateResendButton(text, disabled) {
  const btn = document.querySelector('.link-btn');
  if (btn) {
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;

  // Check if token is still valid (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp < currentTime) {
      // Token expired
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    logout();
    return false;
  }
}

/**
 * Get current user
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  AuthState.isAuthenticated = false;
  AuthState.user = null;

  // Redirect to auth screen
  showScreen('auth');
}

/**
 * Show success message
 */
function showSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.innerHTML = `
    <svg class="icon icon-sm icon-success" viewBox="0 0 24 24">
      <use href="#icon-verified"></use>
    </svg>
    ${message}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}

/**
 * Show error message
 */
function showError(message) {
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.innerHTML = `
    <svg class="icon icon-sm icon-danger" viewBox="0 0 24 24">
      <use href="#icon-close"></use>
    </svg>
    ${message}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 4000);
}

// ===================================
// AUTO-FOCUS AND INPUT HANDLING
// ===================================

// Auto-format phone number as user types - Flexible Nigerian format support
document.addEventListener('DOMContentLoaded', function() {
  const phoneInput = document.getElementById('authPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let value = e.target.value;

      // Allow natural typing - don't remove plus sign immediately
      // Only clean up when user stops typing (debounce)
      clearTimeout(this.formatTimeout);
      this.formatTimeout = setTimeout(() => {
        formatPhoneNumber(e.target);
      }, 300);
    });
  }
});

// Format phone number with flexible Nigerian number support
function formatPhoneNumber(input) {
  let value = input.value.replace(/\s/g, ''); // Remove spaces for processing

  // Handle different input formats
  if (value.startsWith('+234')) {
    // Already in international format
    value = '+234' + value.substring(4).replace(/\D/g, '');
  } else if (value.startsWith('234')) {
    // Add plus sign
    value = '+' + value.replace(/\D/g, '');
  } else if (value.startsWith('0')) {
    // Convert local format to international
    value = '+234' + value.substring(1).replace(/\D/g, '');
  } else if (value.match(/^[1-9]/)) {
    // Add country code
    value = '+234' + value.replace(/\D/g, '');
  } else {
    // Clean up any other format
    value = value.replace(/\D/g, '');
    if (value.length > 0) {
      value = '+234' + value;
    }
  }

  // Validate length (10 digits after +234)
  const digits = value.replace(/\D/g, '');
  if (digits.length === 13) { // +234 + 10 digits
    // Format as +234 XXX XXX XXXX
    value = value.replace(/(\+234)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  } else if (digits.length > 13) {
    value = value.substring(0, 17); // Limit to +234 XXX XXX XXXX
  } else if (digits.length >= 10) {
    // Partial formatting
    value = value.replace(/(\+234)(\d{3})(\d{3})/, '$1 $2 $3');
    if (digits.length > 10) {
      value += ' ' + digits.substring(10, 14);
    }
  }

  input.value = value;
}

  // Handle OTP input auto-focus to next digit
  const otpInput = document.getElementById('otpCode');
  if (otpInput) {
    otpInput.addEventListener('input', function(e) {
      const value = e.target.value.replace(/\D/g, '');
      e.target.value = value;

      // Auto-verify when 6 digits are entered
      if (value.length === 6) {
        setTimeout(() => verifyOTP(), 500);
      }
    });
  }

// ===================================
// INITIALIZE AUTH ON APP START
// ===================================

// Check authentication status when app loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking authentication...');

  // Small delay to ensure all elements are loaded
  setTimeout(() => {
    if (isAuthenticated()) {
      AuthState.user = getCurrentUser();
      updateUIForAuthenticatedUser();
    }
  }, 100);
});

// ===================================
// EXPORT FUNCTIONS
// ===================================

window.initializeAuth = initializeAuth;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.resendOTP = resendOTP;
window.showPhoneStep = showPhoneStep;
window.skipAuthentication = skipAuthentication;
window.logout = logout;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
