/**
 * App Module - Core application logic and screen navigation
 * @module app
 */

// ===================================
// STATE MANAGEMENT
// ===================================

const AppState = {
  currentScreen: 'home',
  screenHistory: ['home'],
  searchResults: [],
  selectedProperty: null,
  userPhone: '',
  formData: {}
};

// ===================================
// SCREEN NAVIGATION
// ===================================

/**
 * Show a screen by ID
 * @param {string} screenId - Screen ID to show
 */
function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  // Show requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    
    // Add haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Update state
    if (screenId !== AppState.currentScreen) {
      AppState.screenHistory.push(screenId);
      AppState.currentScreen = screenId;
    }
    
    // Update back button visibility
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.style.display = screenId === 'home' ? 'none' : 'block';
    }
    
    // Close menu if open
    closeMenu();
    
    // Screen-specific initialization
    initializeScreen(screenId);
  }
}

/**
 * Go back to previous screen
 */
function goBack() {
  if (AppState.screenHistory.length > 1) {
    AppState.screenHistory.pop();
    const previousScreen = AppState.screenHistory[AppState.screenHistory.length - 1];
    showScreen(previousScreen);
  }
}

/**
 * Initialize screen-specific functionality
 * @param {string} screenId - Screen ID
 */
function initializeScreen(screenId) {
  switch (screenId) {
    case 'find-results':
      renderSearchResults();
      break;
    case 'property-detail':
      renderPropertyDetail();
      break;
    default:
      break;
  }
}

// ===================================
// MENU FUNCTIONALITY
// ===================================

/**
 * Toggle menu panel
 */
function toggleMenu() {
  const menu = document.getElementById('menuPanel');
  if (menu) {
    menu.classList.toggle('active');
  }
}

/**
 * Close menu panel
 */
function closeMenu() {
  const menu = document.getElementById('menuPanel');
  if (menu) {
    menu.classList.remove('active');
  }
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
  const secondaryNav = document.querySelector('.secondary-nav');
  if (secondaryNav && !secondaryNav.contains(e.target)) {
    closeMenu();
  }
});

// ===================================
// FIND PROPERTY FLOW
// ===================================

/**
 * Start property search
 */
async function findProperties() {
  // Get search query
  const queryInput = document.querySelector('#find-step2 .text-area');
  const query = queryInput ? queryInput.value.trim() : '';
  
  if (!query) {
    showError('Please describe what you\'re looking for');
    return;
  }
  
  // Show processing screen
  showScreen('find-processing');
  
  try {
    // Call API to search properties (using AI to parse query)
    const userPhone = AppState.userPhone || '+234';
    const response = await API.chat.sendMessage(query, userPhone);
    
    // Simulate processing animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // If AI returned property matches
    if (response.intent === 'search' && response.entities) {
      const properties = await API.properties.search(response.entities);
      AppState.searchResults = properties;
      showScreen('find-results');
    } else {
      // Show AI response in a dialog
      alert(response.response || 'No properties found. Try different criteria.');
      showScreen('find-step2');
    }
  } catch (error) {
    console.error('Search error:', error);
    showError('Failed to search properties. Please try again.');
    showScreen('find-step2');
  }
}

/**
 * Render search results
 */
function renderSearchResults() {
  const container = document.querySelector('#find-results .results-container');
  if (!container) return;
  
  // Clear existing results
  const existingCards = container.querySelectorAll('.property-card');
  existingCards.forEach(card => card.remove());
  
  // Render property cards
  AppState.searchResults.forEach((property, index) => {
    const card = createPropertyCard(property, index);
    container.appendChild(card);
  });
}

/**
 * Create property card element
 * @param {object} property - Property data
 * @param {number} index - Card index
 * @returns {HTMLElement}
 */
function createPropertyCard(property, index) {
  const card = document.createElement('div');
  card.className = 'property-card';
  card.onclick = () => showPropertyDetail(property.id);
  
  const verified = property.verified ? '<div class="verified-badge">Verified</div>' : '';
  const matchScore = property.matchScore ? `<div class="match-score">Match: ${property.matchScore}%</div>` : '';
  
  card.innerHTML = `
    <div class="property-image">
      ${verified}
      ${property.imageUrl ? `<img src="${property.imageUrl}" alt="${property.type}">` : 'Property Image'}
    </div>
    <div class="property-details">
      <div class="property-price">₦${property.price.toLocaleString()}/year</div>
      <div class="property-location">${property.type} • ${property.location}</div>
      <div class="property-specs">
        ${property.area ? `<span>${property.area}m²</span>` : ''}
        ${property.bedrooms ? `<span>${property.bedrooms} bed</span>` : ''}
        ${property.bathrooms ? `<span>${property.bathrooms} bath</span>` : ''}
      </div>
      ${matchScore}
    </div>
  `;
  
  return card;
}

/**
 * Show property detail
 * @param {number} propertyId - Property ID
 */
async function showPropertyDetail(propertyId) {
  try {
    showLoading(true);
    const property = await API.properties.getById(propertyId);
    AppState.selectedProperty = property;
    
    // Track view
    API.properties.trackView(propertyId);
    
    showScreen('property-detail');
    showLoading(false);
  } catch (error) {
    console.error('Error loading property:', error);
    showError('Failed to load property details');
    showLoading(false);
  }
}

/**
 * Render property detail
 */
function renderPropertyDetail() {
  const property = AppState.selectedProperty;
  if (!property) return;
  
  // Update property details in the detail screen
  const detailScreen = document.getElementById('property-detail');
  if (!detailScreen) return;
  
  const priceEl = detailScreen.querySelector('.property-price');
  const locationEl = detailScreen.querySelector('.property-location');
  const specsEl = detailScreen.querySelector('.property-specs');
  
  if (priceEl) priceEl.textContent = `₦${property.price.toLocaleString()}/year`;
  if (locationEl) locationEl.textContent = property.location;
  if (specsEl) {
    specsEl.innerHTML = `
      ${property.area ? `<span>${property.area}m²</span>` : ''}
      ${property.bedrooms ? `<span>${property.bedrooms} Bed</span>` : ''}
      ${property.bathrooms ? `<span>${property.bathrooms} Bath</span>` : ''}
    `;
  }
}

/**
 * Contact landlord
 */
function contactLandlord() {
  const property = AppState.selectedProperty;
  if (!property) return;
  
  const message = encodeURIComponent(
    `Hi, I found your property on Propabridge (ID: ${property.id}). I'm interested in viewing it.`
  );
  
  const whatsappUrl = `https://wa.me/2348055269579?text=${message}`;
  
  if (confirm('Open WhatsApp to contact landlord?')) {
    window.open(whatsappUrl, '_blank');
  }
}

// ===================================
// LIST PROPERTY FLOW
// ===================================

/**
 * Handle property listing submission
 */
async function submitPropertyListing() {
  try {
    showLoading(true);
    
    // Collect form data
    const propertyData = {
      // Add form field values here
    };
    
    const result = await API.properties.create(propertyData);
    
    if (result.success) {
      showScreen('list-success');
    }
    
    showLoading(false);
  } catch (error) {
    console.error('Error listing property:', error);
    showError('Failed to list property. Please try again.');
    showLoading(false);
  }
}

// ===================================
// OPTION BUTTONS (Bedrooms, Property Type, etc.)
// ===================================

// Handle option button selection
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('option-btn')) {
    const group = e.target.parentNode;
    group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Show/hide loading spinner
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
  const loader = document.querySelector('.loading');
  if (loader) {
    loader.classList.toggle('active', show);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorEl = document.querySelector('.error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('active');
    
    setTimeout(() => {
      errorEl.classList.remove('active');
    }, 5000);
  } else {
    alert(message);
  }
}

/**
 * Save phone number
 * @param {string} phone - Phone number
 */
function savePhoneNumber(phone) {
  AppState.userPhone = phone;
  localStorage.setItem('userPhone', phone);
}

/**
 * Get saved phone number
 * @returns {string}
 */
function getSavedPhoneNumber() {
  return localStorage.getItem('userPhone') || '';
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Propabridge initialized');
  
  // Restore saved phone number
  const savedPhone = getSavedPhoneNumber();
  if (savedPhone) {
    AppState.userPhone = savedPhone;
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
      phoneInput.value = savedPhone;
    }
  }
  
  // Show home screen
  showScreen('home');
  
  // Check authentication status
  if (API.auth.isAuthenticated()) {
    const user = API.auth.getCurrentUser();
    console.log('User authenticated:', user?.phone);
  }
});

// ===================================
// EXPORT FUNCTIONS FOR GLOBAL SCOPE
// ===================================

window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.findProperties = findProperties;
window.showPropertyDetail = showPropertyDetail;
window.contactLandlord = contactLandlord;
window.submitPropertyListing = submitPropertyListing;

