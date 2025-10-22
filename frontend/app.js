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
    
    // Add haptic feedback (if supported and user has interacted)
    if (navigator.vibrate && document.hasFocus()) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // Ignore vibrate errors
      }
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
  // Check if we're on a listing screen and use listing navigation
  const currentScreen = document.querySelector('.screen.active')?.id;
  if (currentScreen && currentScreen.startsWith('list-step')) {
    // Use listing navigation for listing screens
    if (typeof window.goBackFromListing === 'function') {
      window.goBackFromListing();
      return;
    }
  }

  // Default navigation for other screens
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
  console.log('Initializing screen:', screenId);

  switch (screenId) {
    case 'find-results':
      // Ensure results are visible immediately
      setTimeout(() => {
        renderSearchResults();
        // Make sure the summary is visible
        const summaryEl = document.getElementById('resultsSummary');
        if (summaryEl) {
          summaryEl.style.opacity = '1';
          summaryEl.style.transform = 'translateY(0)';
        }
      }, 100);
      break;
    case 'property-detail':
      renderPropertyDetail();
      break;
    case 'find-processing':
      // Reset progress steps for new search
      resetProgressSteps();
      break;
    default:
      break;
  }
}

/**
 * Reset progress steps for new search
 */
function resetProgressSteps() {
  const progressSteps = document.getElementById('progressSteps');
  if (!progressSteps) return;

  const steps = progressSteps.querySelectorAll('.progress-item');
  steps.forEach((step, index) => {
    step.classList.remove('completed', 'loading');
    step.innerHTML = `
      <svg class="icon icon-loading" viewBox="0 0 24 24">
        <use href="#icon-loading"></use>
      </svg>
      <span>${step.querySelector('span').textContent}</span>
    `;
  });
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
 * Start property search with AI-powered parsing
 */
async function findProperties() {
  // Get search query
  const queryInput = document.querySelector('#find-step2 .text-area');
  const query = queryInput ? queryInput.value.trim() : '';

  if (!query) {
    showError('Please describe what you\'re looking for');
    return;
  }

  // Show processing screen immediately
  showScreen('find-processing');

  // Update processing text to show it's analyzing the query
  updateProcessingStatus('Analyzing your requirements...', 1);

  try {
    // Get user phone for context
    const userPhone = AppState.userPhone || '+234';

    // Step 1: Send to AI for intent and entity extraction
    console.log('Sending query to AI for processing:', query);
    const aiResponse = await API.chat.sendMessage(query, userPhone);

    // Step 2: Update processing status
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateProcessingStatus('Extracting location and preferences...', 2);

    // Step 3: Parse AI response and extract search criteria
    let searchCriteria = {};

    if (aiResponse.entities) {
      // Use entities from AI response
      searchCriteria = {
        location: aiResponse.entities.location,
        propertyType: aiResponse.entities.propertyType,
        minPrice: aiResponse.entities.minPrice,
        maxPrice: aiResponse.entities.maxPrice,
        bedrooms: aiResponse.entities.bedrooms,
        amenities: aiResponse.entities.amenities || []
      };
      console.log('Extracted search criteria:', searchCriteria);
    } else {
      // Fallback: manual parsing for common patterns
      searchCriteria = parseQueryManually(query);
      console.log('Manual parsing result:', searchCriteria);
    }

    // Step 4: Update processing status
    await new Promise(resolve => setTimeout(resolve, 800));
    updateProcessingStatus(`Searching in ${searchCriteria.location || 'all areas'}...`, 3);

    // Step 5: Search properties using the criteria
    console.log('Searching properties with criteria:', searchCriteria);
    const properties = await API.properties.search(searchCriteria);

    // Step 6: Update processing status
    await new Promise(resolve => setTimeout(resolve, 800));
    updateProcessingStatus('Calculating match scores...', 4);

    // Step 7: Calculate match scores and rank properties
    const rankedProperties = await rankPropertiesByMatch(properties, searchCriteria);

    // Step 8: Update processing status
    await new Promise(resolve => setTimeout(resolve, 500));
    updateProcessingStatus('Finalizing results...', 5);

    // Step 9: Show results
    AppState.searchResults = rankedProperties;
    await new Promise(resolve => setTimeout(resolve, 300));
    showScreen('find-results');

    console.log(`Found ${rankedProperties.length} matching properties`);

  } catch (error) {
    console.error('Search error:', error);
    showError('Failed to search properties. Please try again.');
    showScreen('find-step2');
  }
}

/**
 * Manually parse query for common patterns (fallback)
 */
function parseQueryManually(query) {
  const criteria = {};

  // Location patterns
  const locationPatterns = [
    /in\s+([A-Za-z\s,]+)/i,
    /at\s+([A-Za-z\s,]+)/i,
    /([A-Za-z\s,]+)\s+area/i
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      criteria.location = match[1].trim();
      break;
    }
  }

  // Bedroom patterns
  const bedroomPatterns = [
    /(\d+)\s*(?:bed|bedroom|br)/i,
    /(\d+)\s*bedroom/i,
    /at\s+least\s+(\d+)/i
  ];

  for (const pattern of bedroomPatterns) {
    const match = query.match(pattern);
    if (match) {
      criteria.bedrooms = parseInt(match[1]);
      break;
    }
  }

  // Price patterns
  const pricePatterns = [
    /under\s*([0-9\.]+)([KMBkmb])/i,
    /below\s*([0-9\.]+)([KMBkmb])/i,
    /([0-9\.]+)([KMBkmb])\s*range/i,
    /([0-9\.]+)-([0-9\.]+)([KMBkmb])/i
  ];

  for (const pattern of pricePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (match[2]) { // Single price with unit
        criteria.maxPrice = parsePrice(`${match[1]}${match[2]}`);
      } else if (match[3]) { // Range
        criteria.minPrice = parsePrice(`${match[1]}${match[3]}`);
        criteria.maxPrice = parsePrice(`${match[2]}${match[3]}`);
      }
      break;
    }
  }

  // Property type patterns
  const typePatterns = [
    /(flat|apartment|house|duplex|bungalow|penthouse|studio)/i
  ];

  for (const pattern of typePatterns) {
    const match = query.match(pattern);
    if (match) {
      criteria.propertyType = match[1];
      break;
    }
  }

  // Amenity patterns
  const amenityKeywords = ['parking', 'gym', 'pool', 'security', 'generator', 'power', 'water', 'garden', 'balcony'];
  criteria.amenities = amenityKeywords.filter(amenity => query.toLowerCase().includes(amenity));

  return criteria;
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr) {
  const match = priceStr.match(/([0-9\.]+)([KMBkmb])/i);
  if (!match) return parseFloat(priceStr);

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'K': return value * 1000;
    case 'M': return value * 1000000;
    case 'B': return value * 1000000000;
    default: return value;
  }
}

/**
 * Rank properties by match score
 */
async function rankPropertiesByMatch(properties, criteria) {
  // Simple scoring algorithm
  const scored = properties.map(property => {
    let score = 0;

    // Location matching (30%)
    if (criteria.location && property.location.toLowerCase().includes(criteria.location.toLowerCase())) {
      score += 30;
    }

    // Price matching (25%)
    if (criteria.maxPrice && property.price <= criteria.maxPrice) {
      if (criteria.minPrice && property.price >= criteria.minPrice) {
        score += 25; // Perfect range
      } else {
        score += 20; // Within max
      }
    }

    // Bedroom matching (20%)
    if (criteria.bedrooms && property.bedrooms === criteria.bedrooms) {
      score += 20;
    } else if (criteria.bedrooms && property.bedrooms >= criteria.bedrooms) {
      score += 15; // More bedrooms than requested
    }

    // Property type matching (15%)
    if (criteria.propertyType && property.type.toLowerCase().includes(criteria.propertyType.toLowerCase())) {
      score += 15;
    }

    // Amenities matching (10%)
    if (criteria.amenities && criteria.amenities.length > 0) {
      const matchingAmenities = criteria.amenities.filter(amenity =>
        property.amenities?.some(pa => pa.toLowerCase().includes(amenity.toLowerCase()))
      );
      score += (matchingAmenities.length / criteria.amenities.length) * 10;
    }

    // Verified property bonus (5%)
    if (property.verified) score += 5;

    return { ...property, matchScore: Math.round(score) };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Update processing status display
 */
function updateProcessingStatus(message, step) {
  const progressSteps = document.getElementById('progressSteps');
  if (!progressSteps) return;

  const steps = progressSteps.querySelectorAll('.progress-item');

  // Mark previous steps as completed
  steps.forEach((stepEl, index) => {
    if (index < step - 1) {
      stepEl.classList.add('completed');
      stepEl.classList.remove('loading');
      stepEl.innerHTML = `
        <svg class="icon icon-check icon-success" viewBox="0 0 24 24">
          <use href="#icon-check"></use>
        </svg>
        <span>${stepEl.querySelector('span').textContent}</span>
      `;
    } else if (index === step - 1) {
      stepEl.classList.add('loading');
      stepEl.classList.remove('completed');
      stepEl.innerHTML = `
        <svg class="icon icon-loading" viewBox="0 0 24 24">
          <use href="#icon-loading"></use>
        </svg>
        <span>${message}</span>
      `;
    }
  });
}

/**
 * Render search results
 */
function renderSearchResults() {
  const container = document.querySelector('#find-results .results-container');
  if (!container) return;

  // Update results summary
  updateResultsSummary();

  // Clear existing results (except summary)
  const existingCards = container.querySelectorAll('.property-card');
  existingCards.forEach(card => card.remove());

  // If no results, show message
  if (AppState.searchResults.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'no-results glass';
    noResults.innerHTML = `
      <svg class="icon icon-xl icon-secondary" viewBox="0 0 24 24">
        <use href="#icon-search"></use>
      </svg>
      <h3>No properties found</h3>
      <p>Try adjusting your search criteria or exploring different areas.</p>
    `;
    container.appendChild(noResults);
    return;
  }

  // Render property cards
  AppState.searchResults.forEach((property, index) => {
    const card = createPropertyCard(property, index);
    container.appendChild(card);
  });
}

/**
 * Update results summary based on actual search results
 */
function updateResultsSummary() {
  const summaryEl = document.getElementById('resultsSummary');
  if (!summaryEl) return;

  const results = AppState.searchResults;
  const count = results.length;

  if (count === 0) {
    summaryEl.innerHTML = `
      <svg class="icon icon-sm icon-secondary" viewBox="0 0 24 24">
        <use href="#icon-search"></use>
      </svg>
      <strong>No matches found</strong><br>
      Try different criteria or check nearby areas.
    `;
    return;
  }

  // Find best match
  const bestMatch = results[0];
  const bestScore = bestMatch.matchScore || 96;

  // Determine market position
  const avgPrice = results.reduce((sum, p) => sum + p.price, 0) / count;
  const marketPosition = avgPrice < 2500000 ? 'below market price' : 'competitive price';

  let summaryText = '';

  if (count === 1) {
    summaryText = `Perfect match found! This property scores ${bestScore}/100 — ${marketPosition}.`;
  } else {
    summaryText = `${count} properties match your needs. Best match scores ${bestScore}/100 — ${marketPosition}.`;
  }

  summaryEl.innerHTML = `
    <svg class="icon icon-sm icon-primary" viewBox="0 0 24 24">
      <use href="#icon-star"></use>
    </svg>
    <strong>Perfect Match${count > 1 ? 'es' : ''} Found</strong><br>
    ${summaryText}
  `;
}

/**
 * Create property card element - 10/10 Design
 * @param {object} property - Property data
 * @param {number} index - Card index
 * @returns {HTMLElement}
 */
function createPropertyCard(property, index) {
  const card = document.createElement('div');
  card.className = 'property-card glass';
  card.onclick = () => showPropertyDetail(property.id);

  // Format price properly
  const formattedPrice = formatPriceDisplay(property.price);

  // Format specs with SVG icons
  const specs = [];
  if (property.area) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-area"></use></svg>${property.area}m²`);
  if (property.bedrooms) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bed"></use></svg>${property.bedrooms} Bed`);
  if (property.bathrooms) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bath"></use></svg>${property.bathrooms} Bath`);

  // Format amenities
  const amenities = property.amenities ? property.amenities.slice(0, 4).map(amenity => `<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-star"></use></svg>${amenity}`).join(' ') : '';

  // Match score with better styling
  const matchScore = property.matchScore ?
    `<div class="match-score glass-intense">
       <svg class="match-icon icon icon-sm icon-primary" viewBox="0 0 24 24"><use href="#icon-star"></use></svg>
       <span class="match-text">${property.matchScore}% Match</span>
     </div>` : '';

  // Property features
  const features = property.features ?
    `<div class="property-features">${property.features}</div>` : '';

  // Handle image display - fix the primaryImage object parsing
  let imageHtml = '';
  if (property.primaryImage) {
    // Check if primaryImage is an object with image_url property (from backend)
    if (typeof property.primaryImage === 'object' && property.primaryImage.image_url) {
      imageHtml = `<img src="${property.primaryImage.image_url}" alt="${property.type}" class="property-img" loading="lazy">`;
    }
    // Check if primaryImage is already a URL string (fallback)
    else if (typeof property.primaryImage === 'string') {
      imageHtml = `<img src="${property.primaryImage}" alt="${property.type}" class="property-img" loading="lazy">`;
    }
    // Check if there's an images array with URLs
    else if (property.images && property.images.length > 0) {
      const firstImage = property.images.find(img => img.image_url) || property.images[0];
      if (firstImage && firstImage.image_url) {
        imageHtml = `<img src="${firstImage.image_url}" alt="${property.type}" class="property-img" loading="lazy">`;
      }
    }
  }

  // Fallback placeholder
  if (!imageHtml) {
    imageHtml = `<div class="image-placeholder glass">
       <svg class="image-icon icon-lg icon-secondary" viewBox="0 0 24 24">
         <use href="#icon-house"></use>
       </svg>
       <div class="image-text">${property.type || 'Property'}</div>
     </div>`;
  }

  card.innerHTML = `
    <div class="property-image-container">
      <div class="property-image">
        ${imageHtml}
        ${property.verified ? `
          <div class="verified-badge glass-intense">
            <svg class="icon icon-sm" viewBox="0 0 24 24">
              <use href="#icon-verified"></use>
            </svg>
            Verified
          </div>
        ` : ''}
      </div>
    </div>
    <div class="property-content">
      <div class="property-header">
        <h3 class="property-title">${property.type}</h3>
        <div class="property-price">${formattedPrice}</div>
      </div>

      <div class="property-location">
        <svg class="icon icon-sm icon-secondary" viewBox="0 0 24 24">
          <use href="#icon-location"></use>
        </svg>
        ${property.location}
      </div>

      <div class="property-specs">
        ${specs.join(' • ')}
      </div>

      ${amenities ? `<div class="property-amenities">${amenities}</div>` : ''}

      ${matchScore}

      ${features ? `<div class="property-features-section">${features}</div>` : ''}

      <div class="property-actions">
        <button class="btn-secondary property-action-btn" onclick="event.stopPropagation(); contactLandlord(${property.id})">
          <svg class="btn-icon icon" viewBox="0 0 24 24">
            <use href="#icon-phone"></use>
          </svg>
          <span>Contact Landlord</span>
        </button>
        <button class="btn-primary property-action-btn" onclick="event.stopPropagation(); showPropertyDetail(${property.id})">
          <svg class="btn-icon icon" viewBox="0 0 24 24">
            <use href="#icon-view"></use>
          </svg>
          <span>View Details</span>
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Format price for display in property cards
 * @param {string|number} price - Raw price
 * @returns {string} - Formatted price
 */
function formatPriceDisplay(price) {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'Price on request';

  if (numPrice >= 1000000) {
    return `₦${(numPrice / 1000000).toFixed(1)}M<span class="price-period">/year</span>`;
  } else if (numPrice >= 1000) {
    return `₦${(numPrice / 1000).toFixed(0)}K<span class="price-period">/year</span>`;
  }
  return `₦${numPrice.toLocaleString()}<span class="price-period">/year</span>`;
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

  console.log('Rendering property detail for:', property.type, property.location);

  // Update property details in the detail screen
  const detailScreen = document.getElementById('property-detail');
  if (!detailScreen) return;

  // Update title and price
  const titleEl = detailScreen.querySelector('.property-title-detail');
  const priceEl = detailScreen.querySelector('.property-price-detail');
  const locationEl = detailScreen.querySelector('.property-location-detail');
  const specsEl = detailScreen.querySelector('.property-specs-detail');

  if (titleEl) titleEl.textContent = property.type;
  if (priceEl) priceEl.innerHTML = `₦${property.price.toLocaleString()}<span class="price-period-detail">/year</span>`;
  if (locationEl) {
    locationEl.innerHTML = `
      <svg class="icon icon-sm icon-secondary" viewBox="0 0 24 24">
        <use href="#icon-location"></use>
      </svg>
      <span>${property.location}</span>
    `;
  }

  // Update specs with icons
  if (specsEl) {
    const specs = [];
    if (property.area) specs.push(`
      <span class="spec-item">
        <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-area"></use></svg>
        ${property.area}m²
      </span>
    `);
    if (property.bedrooms) specs.push(`
      <span class="spec-item">
        <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bed"></use></svg>
        ${property.bedrooms} Bedrooms
      </span>
    `);
    if (property.bathrooms) specs.push(`
      <span class="spec-item">
        <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bath"></use></svg>
        ${property.bathrooms} Bathrooms
      </span>
    `);
    if (property.parking) specs.push(`
      <span class="spec-item">
        <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-parking"></use></svg>
        ${property.parking} Parking
      </span>
    `);

    specsEl.innerHTML = specs.join('');
  }

  // Update property image - handle primaryImage object properly
  const imageContainer = detailScreen.querySelector('.detail-image');
  if (imageContainer) {
    let imageUrl = null;

    // Extract image URL from primaryImage object
    if (property.primaryImage) {
      if (typeof property.primaryImage === 'object' && property.primaryImage.image_url) {
        imageUrl = property.primaryImage.image_url;
      } else if (typeof property.primaryImage === 'string') {
        imageUrl = property.primaryImage;
      }
    }

    // Check images array as fallback
    if (!imageUrl && property.images && property.images.length > 0) {
      const firstImage = property.images.find(img => img.image_url) || property.images[0];
      if (firstImage && firstImage.image_url) {
        imageUrl = firstImage.image_url;
      }
    }

    if (imageUrl) {
      // Use actual property image
      imageContainer.innerHTML = `
        <img src="${imageUrl}" alt="${property.type}" class="property-img" loading="lazy">
        ${property.verified ? `
          <div class="verified-badge glass-intense">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-verified"></use></svg>
            Verified
          </div>
        ` : ''}
      `;
    } else {
      // Fallback placeholder
      imageContainer.innerHTML = `
        <div class="image-placeholder-detail">
          <svg class="image-icon-detail icon-xl icon-secondary" viewBox="0 0 24 24">
            <use href="#icon-house"></use>
          </svg>
          <div class="image-text-detail">${property.type || 'Property'}</div>
        </div>
        ${property.verified ? `
          <div class="verified-badge glass-intense">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-verified"></use></svg>
            Verified
          </div>
        ` : ''}
      `;
    }
  }

  // Update AI summary if available
  const aiSummaryEl = detailScreen.querySelector('.ai-summary');
  if (aiSummaryEl && property.matchScore) {
    const reasons = [
      `${property.matchScore}% match with your requirements`,
      property.verified ? 'Verified property with authentic documents' : 'Property available for viewing',
      'Competitive pricing in the area',
      'Good neighborhood and amenities'
    ];

    aiSummaryEl.innerHTML = `
      <h4 class="ai-summary-title">
        <svg class="icon icon-sm icon-primary" viewBox="0 0 24 24">
          <use href="#icon-star"></use>
        </svg>
        <span>Why AI Recommends This</span>
      </h4>
      <ul class="ai-summary-list">
        ${reasons.map(reason => `<li>${reason}</li>`).join('')}
      </ul>
    `;
  }

  console.log('Property detail rendered successfully');
}

/**
 * Contact landlord
 */
function contactLandlord(propertyId) {
  if (!propertyId) {
    const property = AppState.selectedProperty;
    if (!property) return;
    propertyId = property.id;
  }
  
  const message = encodeURIComponent(
    `Hi! I'm interested in your property (ID: ${propertyId}) on Propabridge. Can we schedule a viewing?`
  );
  
  const whatsappUrl = `https://wa.me/2348055269579?text=${message}`;
  
  if (confirm('Open WhatsApp to contact landlord?')) {
    window.open(whatsappUrl, '_blank');
  }
}

// ===================================
// LIST PROPERTY FLOW
// ===================================

// Property listing functionality moved to listing.js for complete implementation

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

  // Initialize authentication first
  initializeAuth();

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    });
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

