/**
 * Admin Module - Property management and approval functionality
 * @module admin
 */

// ===================================
// ADMIN STATE
// ===================================

const AdminState = {
  pendingProperties: [],
  stats: null,
  isLoading: false
};

// ===================================
// ADMIN FUNCTIONS
// ===================================

/**
 * Initialize admin dashboard
 */
function initializeAdmin() {
  console.log('Initializing admin dashboard...');

  // Check if admin is logged in
  if (!API.admin.isAdminLoggedIn()) {
    showAdminLogin();
    return;
  }

  // Admin is logged in, load dashboard
  loadAdminStats();
  loadPendingProperties();
}

/**
 * Show admin login screen
 */
function showAdminLogin() {
  console.log('Showing admin login...');
  showScreen('admin-login');
}

/**
 * Show admin dashboard (checks authentication)
 */
function showAdminDashboard() {
  if (API.admin.isAdminLoggedIn()) {
    showScreen('admin');
  } else {
    showScreen('admin-login');
  }
}

/**
 * Admin logout
 */
function adminLogout() {
  if (confirm('Are you sure you want to logout from admin dashboard?')) {
    API.admin.adminLogout();
    showSuccess('Admin logged out successfully');
    showScreen('home');
  }
}

/**
 * Admin login function
 */
async function adminLogin() {
  const phoneInput = document.getElementById('adminPhone');
  const passwordInput = document.getElementById('adminPassword');

  const phone = phoneInput ? phoneInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (!phone || !password) {
    showError('Please enter both phone number and password');
    return;
  }

  // Validate phone format (same as regular auth)
  if (!validateNigerianPhone(phone)) {
    showError('Please enter a valid Nigerian phone number. Examples: +234 805 641 9040, 0805 641 9040, or 234 805 641 9040');
    return;
  }

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

  try {
    updateAdminLoginButton('Logging in...', true);

    const response = await API.admin.adminLogin(apiPhone, password);

    if (response.success) {
      showSuccess('Admin login successful!');
      setTimeout(() => {
        showScreen('admin');
      }, 1000);
    } else {
      showError(response.message || 'Admin login failed');
    }

    updateAdminLoginButton('Login as Admin', false);

  } catch (error) {
    console.error('Error during admin login:', error);
    showError('Admin login failed. Please try again.');
    updateAdminLoginButton('Login as Admin', false);
  }
}

/**
 * Update admin login button
 */
function updateAdminLoginButton(text, disabled) {
  const btn = document.getElementById('adminLoginBtn');
  if (btn) {
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.6' : '1';
  }
}

/**
 * Load admin statistics
 */
async function loadAdminStats() {
  try {
    AdminState.isLoading = true;
    const stats = await API.admin.getStats();

    // Update UI
    document.getElementById('totalProperties').textContent = stats.total || 0;
    document.getElementById('pendingProperties').textContent = stats.pending || 0;
    document.getElementById('approvedProperties').textContent = stats.verified || 0;
    document.getElementById('rejectedProperties').textContent = stats.rejected || 0;

    AdminState.stats = stats;
    AdminState.isLoading = false;

    console.log('Admin stats loaded:', stats);
  } catch (error) {
    console.error('Error loading admin stats:', error);
    showError('Failed to load admin statistics');
    AdminState.isLoading = false;
  }
}

/**
 * Load pending properties
 */
async function loadPendingProperties() {
  try {
    AdminState.isLoading = true;
    const properties = await API.admin.getPendingProperties();

    AdminState.pendingProperties = properties;
    renderPendingProperties(properties);

    AdminState.isLoading = false;
    console.log('Pending properties loaded:', properties.length);
  } catch (error) {
    console.error('Error loading pending properties:', error);
    showError('Failed to load pending properties');
    AdminState.isLoading = false;
  }
}

/**
 * Render pending properties list
 * @param {array} properties - Array of pending properties
 */
function renderPendingProperties(properties) {
  const container = document.getElementById('pendingList');
  if (!container) return;

  if (properties.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <svg class="icon icon-xl icon-secondary" viewBox="0 0 24 24">
          <use href="#icon-verified"></use>
        </svg>
        <h3>No pending properties</h3>
        <p>All caught up! No properties waiting for approval.</p>
      </div>
    `;
    return;
  }

  const propertiesHtml = properties.map(property => createPendingPropertyCard(property)).join('');
  container.innerHTML = propertiesHtml;
}

/**
 * Create pending property card HTML
 * @param {object} property - Property object
 * @returns {string} - HTML string
 */
function createPendingPropertyCard(property) {
  const formattedPrice = formatPrice(property.price);
  const createdDate = new Date(property.created_at).toLocaleDateString();

  return `
    <div class="pending-property">
      <div class="pending-property-header">
        <h3 class="pending-property-title">${property.type}</h3>
        <div class="pending-property-price">${formattedPrice}</div>
      </div>

      <div class="pending-property-details">
        📍 ${property.location} • 🛏️ ${property.bedrooms} bed • 🏠 ${property.area}m²
        ${property.features ? `<br>✨ ${property.features}` : ''}
      </div>

      <div class="pending-property-meta">
        <span>Owner: ${property.owner_name || 'Unknown'}</span>
        <span>📞 ${property.owner_phone || 'No phone'}</span>
        <span>📅 ${createdDate}</span>
        <span>🖼️ ${property.image_count || 0} photos</span>
      </div>

      <div class="pending-property-actions">
        <button class="btn-approve" onclick="approveProperty(${property.id})">
          <svg class="icon icon-sm" viewBox="0 0 24 24">
            <use href="#icon-verified"></use>
          </svg>
          Approve
        </button>
        <button class="btn-reject" onclick="rejectProperty(${property.id})">
          <svg class="icon icon-sm" viewBox="0 0 24 24">
            <use href="#icon-close"></use>
          </svg>
          Reject
        </button>
        <button class="btn-secondary" onclick="viewPropertyDetails(${property.id})">
          <svg class="btn-icon icon" viewBox="0 0 24 24">
            <use href="#icon-view"></use>
          </svg>
          View Details
        </button>
      </div>
    </div>
  `;
}

/**
 * Approve a property
 * @param {number} propertyId - Property ID
 */
async function approveProperty(propertyId) {
  if (!confirm('Are you sure you want to approve this property?')) return;

  try {
    const notes = prompt('Optional admin notes:') || '';
    await API.admin.approveProperty(propertyId, notes);

    showSuccess('Property approved successfully!');
    loadAdminStats();
    loadPendingProperties();
  } catch (error) {
    console.error('Error approving property:', error);
    showError('Failed to approve property');
  }
}

/**
 * Reject a property
 * @param {number} propertyId - Property ID
 */
async function rejectProperty(propertyId) {
  const reason = prompt('Reason for rejection (required):');
  if (!reason || !reason.trim()) {
    alert('Rejection reason is required');
    return;
  }

  try {
    await API.admin.rejectProperty(propertyId, reason.trim());

    showSuccess('Property rejected');
    loadAdminStats();
    loadPendingProperties();
  } catch (error) {
    console.error('Error rejecting property:', error);
    showError('Failed to reject property');
  }
}

/**
 * View property details (navigate to property detail screen)
 * @param {number} propertyId - Property ID
 */
function viewPropertyDetails(propertyId) {
  // For now, just show an alert - in a real implementation, this would navigate to a detailed view
  alert(`Viewing property details for ID: ${propertyId}\n\nThis would open a detailed property view with full information, images, and approval options.`);
}

/**
 * Refresh pending properties
 */
function refreshPendingProperties() {
  console.log('Refreshing pending properties...');
  loadAdminStats();
  loadPendingProperties();
}

/**
 * Bulk approve all pending properties
 */
async function bulkApproveProperties() {
  if (AdminState.pendingProperties.length === 0) {
    alert('No pending properties to approve');
    return;
  }

  if (!confirm(`Approve all ${AdminState.pendingProperties.length} pending properties?`)) return;

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const property of AdminState.pendingProperties) {
      try {
        await API.admin.approveProperty(property.id, 'Bulk approved');
        successCount++;
      } catch (error) {
        console.error(`Failed to approve property ${property.id}:`, error);
        errorCount++;
      }
    }

    showSuccess(`Bulk approval complete: ${successCount} approved, ${errorCount} failed`);
    loadAdminStats();
    loadPendingProperties();
  } catch (error) {
    console.error('Error in bulk approval:', error);
    showError('Bulk approval failed');
  }
}

/**
 * Format price for display
 * @param {string|number} price - Raw price
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'Price not set';

  if (numPrice >= 1000000) {
    return `₦${(numPrice / 1000000).toFixed(1)}M`;
  } else if (numPrice >= 1000) {
    return `₦${(numPrice / 1000).toFixed(0)}K`;
  }
  return `₦${numPrice.toLocaleString()}`;
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  // Create and show success notification
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
    notification.remove();
  }, 3000);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Create and show error notification
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
    notification.remove();
  }, 3000);
}

// ===================================
// GLOBAL ADMIN FUNCTIONS
// ===================================

/**
 * Show admin panel (global function for menu)
 */
function showAdminPanel() {
  if (API.admin.isAdminLoggedIn()) {
    showScreen('admin');
  } else {
    showScreen('admin-login');
  }
}

// Export immediately to global scope
if (typeof window !== 'undefined') {
  window.showAdminPanel = showAdminPanel;
  window.showAdminDashboard = showAdminPanel;
}

// ===================================
// INITIALIZE ON ADMIN SCREEN
// ===================================

// Listen for screen changes to initialize admin dashboard
const originalShowScreen = window.showScreen;
if (originalShowScreen) {
  window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    if (screenId === 'admin') {
      setTimeout(initializeAdmin, 100);
    } else if (screenId === 'admin-login') {
      setTimeout(initializeAdminLogin, 100);
    }
  };
}

// Validate Nigerian phone number - flexible format support (shared utility)
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

// Format phone number with flexible Nigerian number support (shared utility)
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

// Initialize admin login screen
function initializeAdminLogin() {
  const adminPhoneInput = document.getElementById('adminPhone');
  if (adminPhoneInput) {
    adminPhoneInput.addEventListener('input', function(e) {
      let value = e.target.value;

      // Allow natural typing - don't remove plus sign immediately
      clearTimeout(this.formatTimeout);
      this.formatTimeout = setTimeout(() => {
        formatPhoneNumber(e.target);
      }, 300);
    });
  }
}

// ===================================
// EXPORT FUNCTIONS
// ===================================

// Export all functions to global scope
window.showAdminPanel = showAdminPanel;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.loadAdminStats = loadAdminStats;
window.loadPendingProperties = loadPendingProperties;
window.approveProperty = approveProperty;
window.rejectProperty = rejectProperty;
window.viewPropertyDetails = viewPropertyDetails;
window.refreshPendingProperties = refreshPendingProperties;
window.bulkApproveProperties = bulkApproveProperties;

// Also export the old function name for backward compatibility
window.showAdminDashboard = showAdminPanel;

// Ensure functions are available immediately
if (typeof window !== 'undefined') {
  window.showAdminPanel = showAdminPanel;
  window.showAdminDashboard = showAdminPanel;
}
