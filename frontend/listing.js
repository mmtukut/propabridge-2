/**
 * Listing Module - Complete property listing functionality
 * @module listing
 */

// ===================================
// LISTING STATE MANAGEMENT
// ===================================

const ListingState = {
  currentStep: 1,
  totalSteps: 4,
  formData: {
    // Step 1: Basic Info
    address: '',
    phone: '',

    // Step 2: Photos
    photos: [],

    // Step 3: Details - Match HTML defaults
    propertyType: 'apartment', // Default to apartment (selected in HTML)
    bedrooms: 2, // Default to 2 bedrooms (selected in HTML)
    listingType: 'rent', // Default to rent (selected in HTML)
    price: '₦3,500,000',
    area: 180,
    bathrooms: 2,
    amenities: ['24/7 Power', 'Security', 'Parking', 'Pool'], // Match HTML defaults
    description: '24/7 power, water, gated compound, gym, pool',

    // Step 4: Review & Submit
    isSubmitting: false
  },
  validation: {
    address: { valid: false, message: '' },
    phone: { valid: false, message: '' },
    photos: { valid: false, message: '' },
    propertyType: { valid: false, message: '' },
    bedrooms: { valid: true, message: '' },
    listingType: { valid: true, message: '' },
    price: { valid: false, message: '' },
    area: { valid: true, message: '' },
    bathrooms: { valid: true, message: '' }
  }
};

// ===================================
// STEP NAVIGATION
// ===================================

/**
 * Navigate to next step in listing form
 * @param {string} nextStepId - ID of next screen
 */
function nextStep(nextStepId) {
  if (!validateCurrentStep()) {
    showFormError('Please fill in all required fields before continuing');
    return;
  }

  // Collect current step data before moving
  collectFormData();

  showScreen(nextStepId);
  ListingState.currentStep++;

  // Update progress indicator
  updateProgressIndicator();

  // Update review screen if navigating to step 4
  if (nextStepId === 'list-step4') {
    setTimeout(updateReviewScreen, 100);
  }
}

/**
 * Navigate to previous step in listing form
 * @param {string} prevStepId - ID of previous screen
 */
function previousStep(prevStepId) {
  console.log('Navigating to previous step:', prevStepId);

  showScreen(prevStepId);
  ListingState.currentStep--;

  // Update progress indicator
  updateProgressIndicator();
}

/**
 * Update progress indicator based on current step
 */
function updateProgressIndicator() {
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((step, index) => {
    const stepNumber = index + 1;

    if (stepNumber < ListingState.currentStep) {
      step.classList.remove('active');
      step.classList.add('completed');
    } else if (stepNumber === ListingState.currentStep) {
      step.classList.remove('completed');
      step.classList.add('active');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

// ===================================
// FORM DATA COLLECTION
// ===================================

/**
 * Collect form data from current step
 */
function collectFormData() {
  try {
    switch (ListingState.currentStep) {
      case 1:
        collectStep1Data();
        break;
      case 2:
        collectStep2Data();
        break;
      case 3:
        collectStep3Data();
        break;
    }
    console.log('Form data collected:', ListingState.formData);
  } catch (error) {
    console.error('Error collecting form data:', error);
    showFormError(error.message);
    throw error;
  }
}

/**
 * Collect data from step 1 (Basic Info)
 */
function collectStep1Data() {
  const address = document.getElementById('propertyAddress')?.value.trim();
  const phone = document.getElementById('contactPhone')?.value.trim();

  console.log('Collecting step 1 data:', { address, phone });

  if (address) {
    ListingState.formData.address = address;
  } else {
    throw new Error('Please enter a valid property address');
  }

  if (phone) {
    ListingState.formData.phone = phone;
  } else {
    throw new Error('Please enter a valid phone number');
  }
}

/**
 * Collect data from step 2 (Photos)
 */
function collectStep2Data() {
  // Photos are already stored in ListingState.formData.photos
  // This is handled by the upload functions
}

/**
 * Collect data from step 3 (Details)
 */
function collectStep3Data() {
  console.log('Collecting step 3 data');

  // Property type
  const selectedType = document.querySelector('.type-option.selected');
  if (selectedType) {
    ListingState.formData.propertyType = selectedType.dataset.type;
    console.log('Property type:', ListingState.formData.propertyType);
  } else {
    throw new Error('Please select a property type');
  }

  // Bedrooms
  const selectedBedrooms = document.querySelector('.bedroom-option.selected');
  if (selectedBedrooms) {
    ListingState.formData.bedrooms = parseInt(selectedBedrooms.dataset.bedrooms);
    console.log('Bedrooms:', ListingState.formData.bedrooms);
  } else {
    throw new Error('Please select number of bedrooms');
  }

  // Listing type
  const selectedListingType = document.querySelector('.listing-option.selected');
  if (selectedListingType) {
    ListingState.formData.listingType = selectedListingType.dataset.listingType;
    console.log('Listing type:', ListingState.formData.listingType);
  } else {
    throw new Error('Please select listing type');
  }

  // Price
  const priceInput = document.getElementById('propertyPrice');
  if (priceInput && priceInput.value.trim()) {
    ListingState.formData.price = priceInput.value.trim();
    console.log('Price:', ListingState.formData.price);
  } else {
    throw new Error('Please enter a valid price');
  }

  // Area and bathrooms
  const areaInput = document.getElementById('propertyArea');
  const bathroomsInput = document.getElementById('propertyBathrooms');

  if (areaInput && areaInput.value) {
    ListingState.formData.area = parseInt(areaInput.value);
  }

  if (bathroomsInput && bathroomsInput.value) {
    ListingState.formData.bathrooms = parseInt(bathroomsInput.value);
  }

  // Amenities
  const selectedAmenities = document.querySelectorAll('.amenity-checkbox:checked');
  ListingState.formData.amenities = Array.from(selectedAmenities).map(cb => cb.value);
  console.log('Amenities:', ListingState.formData.amenities);

  // Description
  const descriptionInput = document.getElementById('propertyDescription');
  if (descriptionInput) {
    ListingState.formData.description = descriptionInput.value.trim();
  }
}

/**
 * Update review screen with collected data
 */
function updateReviewScreen() {
  console.log('Updating review screen with data:', ListingState.formData);

  try {
    // Collect current form data
    collectFormData();

    // Update basic info
    const addressElement = document.getElementById('reviewAddress');
    const contactElement = document.getElementById('reviewContact');

    if (addressElement) {
      addressElement.textContent = ListingState.formData.address || '-';
      console.log('Updated address element:', addressElement.textContent);
    }
    if (contactElement) {
      contactElement.textContent = ListingState.formData.phone || '-';
      console.log('Updated contact element:', contactElement.textContent);
    }

    // Update property details
    const typeMap = {
      apartment: 'Apartment',
      house: 'House',
      duplex: 'Duplex',
      penthouse: 'Penthouse',
      studio: 'Studio',
      other: 'Other'
    };

    const listingTypeMap = {
      rent: 'For Rent',
      sale: 'For Sale',
      shortlet: 'Short Let'
    };

    const typeElement = document.getElementById('reviewType');
    const bedroomsElement = document.getElementById('reviewBedrooms');
    const priceElement = document.getElementById('reviewPrice');
    const featuresElement = document.getElementById('reviewFeatures');

    if (typeElement) {
      typeElement.textContent = typeMap[ListingState.formData.propertyType] || '-';
      console.log('Updated type element:', typeElement.textContent);
    }
    if (bedroomsElement) {
      bedroomsElement.textContent = `${ListingState.formData.bedrooms || 1} Bedroom${(ListingState.formData.bedrooms || 1) !== 1 ? 's' : ''}`;
      console.log('Updated bedrooms element:', bedroomsElement.textContent);
    }
    if (priceElement) {
      priceElement.textContent = formatPriceDisplay(ListingState.formData.price) || '-';
      console.log('Updated price element:', priceElement.textContent);
    }
    if (featuresElement) {
      featuresElement.textContent = ListingState.formData.amenities.length > 0
        ? ListingState.formData.amenities.join(', ')
        : 'None selected';
      console.log('Updated features element:', featuresElement.textContent);
    }

    // Update photos preview
    updatePhotosPreview();

    console.log('Review screen updated successfully');
  } catch (error) {
    console.error('Error updating review screen:', error);
  }
}

/**
 * Update photos preview in review screen
 */
function updatePhotosPreview() {
  const photosContainer = document.getElementById('reviewPhotos');
  if (!photosContainer) {
    console.log('Photos container not found');
    return;
  }

  console.log('Updating photos preview, photos count:', ListingState.formData.photos.length);

  if (ListingState.formData.photos.length === 0) {
    photosContainer.innerHTML = '<div class="no-photos">No photos uploaded yet</div>';
    return;
  }

  photosContainer.innerHTML = '';
  ListingState.formData.photos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
      <img src="${photo.preview}" alt="Property photo ${index + 1}">
    `;
    photosContainer.appendChild(photoItem);
  });

  console.log('Photos preview updated');
}

// ===================================
// FORM VALIDATION
// ===================================

/**
 * Validate current step before proceeding
 * @returns {boolean} - Whether validation passed
 */
function validateCurrentStep() {
  clearFormErrors();

  switch (ListingState.currentStep) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    default:
      return true;
  }
}

/**
 * Validate step 1 (Basic Info)
 */
function validateStep1() {
  const address = document.getElementById('propertyAddress')?.value.trim();
  const phone = document.getElementById('contactPhone')?.value.trim();

  let isValid = true;

  // Validate address
  if (!address || address.length < 10) {
    showFieldError('propertyAddress', 'Please enter a valid property address (minimum 10 characters)');
    isValid = false;
  }

  // Validate phone
  if (!phone || !isValidPhone(phone)) {
    showFieldError('contactPhone', 'Please enter a valid phone number');
    isValid = false;
  }

  return isValid;
}

/**
 * Validate step 2 (Photos)
 */
function validateStep2() {
  if (ListingState.formData.photos.length < 1) {
    showFormError('Please upload at least 1 photo of your property');
    return false;
  }
  return true;
}

/**
 * Validate step 3 (Details)
 */
function validateStep3() {
  const price = document.getElementById('propertyPrice')?.value.trim();

  // Validate price
  if (!price || !isValidPrice(price)) {
    showFieldError('propertyPrice', 'Please enter a valid price');
    return false;
  }

  // Validate property type selection
  if (!ListingState.formData.propertyType) {
    showFormError('Please select a property type');
    return false;
  }

  return true;
}

/**
 * Show field-specific error
 */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.style.borderColor = '#FF5252';

    // Create or update error message
    let errorEl = field.parentNode.querySelector('.field-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      field.parentNode.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.style.color = '#FF5252';
    errorEl.style.fontSize = '12px';
    errorEl.style.marginTop = '4px';
  }
}

/**
 * Show general form error
 */
function showFormError(message) {
  // Create or update general error message
  let errorEl = document.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    document.querySelector('.listing-form').insertBefore(errorEl, document.querySelector('.form-section'));
  }

  errorEl.textContent = message;
  errorEl.style.color = '#FF5252';
  errorEl.style.fontSize = '14px';
  errorEl.style.marginBottom = '16px';
  errorEl.style.padding = '12px';
  errorEl.style.background = 'rgba(244, 67, 54, 0.1)';
  errorEl.style.border = '1px solid rgba(244, 67, 54, 0.3)';
  errorEl.style.borderRadius = '8px';
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
  // Clear field errors
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.form-error').forEach(el => el.remove());

  // Reset field borders
  document.querySelectorAll('.input-field').forEach(field => {
    field.style.borderColor = '';
  });
}

/**
 * Validate phone number format
 */
function isValidPhone(phone) {
  const phoneRegex = /^(\+234|0)[789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate price format
 */
function isValidPrice(price) {
  const cleanPrice = price.replace(/[^\d.]/g, '');
  const numPrice = parseFloat(cleanPrice);
  return !isNaN(numPrice) && numPrice > 0;
}

// ===================================
// IMAGE UPLOAD FUNCTIONALITY
// ===================================

/**
 * Initialize photo upload functionality
 */
function initializePhotoUpload() {
  const uploadZone = document.getElementById('photoUploadZone');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');

  if (!uploadZone || !photoInput || !photoPreview) return;

  // Click to upload
  uploadZone.addEventListener('click', () => photoInput.click());

  // File input change
  photoInput.addEventListener('change', handleFileSelect);

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });

  // Continue button state
  updateContinueButton();
}

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  handleFiles(files);
}

/**
 * Handle file uploads
 */
function handleFiles(files) {
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      showFormError('Please select only image files');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showFormError('Image size should be less than 10MB');
      return false;
    }

    return true;
  });

  if (validFiles.length === 0) return;

  // Process valid files
  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const photoItem = createPhotoPreview(e.target.result, file.name);
      document.getElementById('photoPreview').appendChild(photoItem);

      // Store photo data
      ListingState.formData.photos.push({
        file: file,
        preview: e.target.result,
        name: file.name
      });

      updateContinueButton();
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Create photo preview element
 */
function createPhotoPreview(src, name) {
  const photoItem = document.createElement('div');
  photoItem.className = 'photo-item';

  photoItem.innerHTML = `
    <img src="${src}" alt="${name}">
    <button class="photo-remove" onclick="removePhoto(this)">×</button>
  `;

  return photoItem;
}

/**
 * Remove photo from preview and state
 */
function removePhoto(button) {
  const photoItem = button.closest('.photo-item');
  const index = Array.from(photoItem.parentNode.children).indexOf(photoItem);

  // Remove from state
  ListingState.formData.photos.splice(index, 1);

  // Remove from DOM
  photoItem.remove();

  updateContinueButton();
}

/**
 * Update continue button state based on photo count
 */
function updateContinueButton() {
  const continueBtn = document.getElementById('photoContinueBtn');
  if (continueBtn) {
    continueBtn.disabled = ListingState.formData.photos.length === 0;
  }
}

// ===================================
// FORM INTERACTIONS
// ===================================

/**
 * Initialize form interactions
 */
function initializeFormInteractions() {
  // Property type selection
  document.querySelectorAll('.type-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.type-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      ListingState.formData.propertyType = option.dataset.type;
    });
  });

  // Bedroom selection
  document.querySelectorAll('.bedroom-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.bedroom-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      ListingState.formData.bedrooms = parseInt(option.dataset.bedrooms);
    });
  });

  // Listing type selection
  document.querySelectorAll('.listing-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.listing-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      ListingState.formData.listingType = option.dataset.listingType;
    });
  });

  // Amenity checkboxes
  document.querySelectorAll('.amenity-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const amenity = checkbox.value;
      if (checkbox.checked) {
        if (!ListingState.formData.amenities.includes(amenity)) {
          ListingState.formData.amenities.push(amenity);
        }
      } else {
        ListingState.formData.amenities = ListingState.formData.amenities.filter(a => a !== amenity);
      }
    });
  });

  // Price input formatting
  const priceInput = document.getElementById('propertyPrice');
  if (priceInput) {
    priceInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d.]/g, '');
      if (value) {
        // Format as currency if it's a large number
        const numValue = parseFloat(value);
        if (numValue >= 1000) {
          if (numValue >= 1000000) {
            value = `${(numValue / 1000000).toFixed(1)}M`;
          } else {
            value = `${(numValue / 1000).toFixed(0)}K`;
          }
        }
      }
      e.target.value = value;
    });
  }
}

// ===================================
// FORM SUBMISSION
// ===================================

/**
 * Submit property listing to backend
 */
async function submitPropertyListing() {
  if (ListingState.formData.isSubmitting) return;

  // Show loading state
  ListingState.formData.isSubmitting = true;
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loading').style.display = 'flex';
    submitBtn.disabled = true;
  }

  try {
    // Collect ALL form data (from all steps)
    console.log('Collecting all form data for submission...');

    // Collect step 1 data
    const address = document.getElementById('propertyAddress')?.value.trim();
    const phone = document.getElementById('contactPhone')?.value.trim();

    if (!address) throw new Error('Property address is required');
    if (!phone) throw new Error('Phone number is required');

    // Collect step 3 data
    const selectedType = document.querySelector('.type-option.selected');
    const selectedBedrooms = document.querySelector('.bedroom-option.selected');
    const selectedListingType = document.querySelector('.listing-option.selected');
    const priceInput = document.getElementById('propertyPrice');
    const bathroomsInput = document.getElementById('propertyBathrooms');
    const areaInput = document.getElementById('propertyArea');
    const descriptionInput = document.getElementById('propertyDescription');

    console.log('Form elements found:', {
      selectedType: selectedType?.dataset?.type,
      selectedBedrooms: selectedBedrooms?.dataset?.bedrooms,
      selectedListingType: selectedListingType?.dataset?.listingType,
      priceInput: priceInput?.value,
      bathroomsInput: bathroomsInput?.value,
      areaInput: areaInput?.value,
      descriptionInput: descriptionInput?.value,
      address,
      phone
    });

    if (!selectedType || !selectedType.dataset?.type) throw new Error('Please select a property type');
    if (!selectedBedrooms || !selectedBedrooms.dataset?.bedrooms) throw new Error('Please select number of bedrooms');
    if (!selectedListingType || !selectedListingType.dataset?.listingType) throw new Error('Please select listing type');
    if (!priceInput || !priceInput.value || !priceInput.value.trim()) throw new Error('Please enter a valid price');

    // Parse price properly
    const rawPrice = priceInput.value.replace(/[^\d.]/g, '');
    const parsedPrice = parseFloat(rawPrice);

    console.log('Price parsing:', {
      originalValue: priceInput.value,
      rawPrice,
      parsedPrice,
      isValid: !isNaN(parsedPrice) && parsedPrice > 0
    });

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new Error('Please enter a valid price');
    }

    // Prepare form data for submission with validation
    const propertyData = {
      type: selectedType.dataset.type,
      location: address,
      price: parsedPrice,
      bedrooms: parseInt(selectedBedrooms.dataset.bedrooms),
      bathrooms: parseInt(bathroomsInput?.value) || parseInt(selectedBedrooms.dataset.bedrooms),
      area: parseInt(areaInput?.value) || 0,
      features: descriptionInput?.value.trim() || '',
      amenities: Array.from(document.querySelectorAll('.amenity-checkbox:checked')).map(cb => cb.value),
      listing_type: selectedListingType.dataset.listingType,
      contact_phone: phone,
      status: 'pending'
    };

    // Final validation before submission
    if (!propertyData.type || propertyData.type.trim() === '') {
      throw new Error('Property type is required');
    }
    if (!propertyData.location || propertyData.location.trim() === '') {
      throw new Error('Property location is required');
    }
    if (!propertyData.price || propertyData.price <= 0) {
      throw new Error('Valid price is required');
    }
    if (!propertyData.bedrooms || propertyData.bedrooms <= 0) {
      throw new Error('Number of bedrooms is required');
    }

    console.log('Final property data to submit:', JSON.stringify(propertyData, null, 2));

    // Final validation
    const requiredFields = ['type', 'location', 'price', 'bedrooms', 'contact_phone'];
    const missingFields = requiredFields.filter(field => !propertyData[field] || propertyData[field] === '');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Submit to backend
    const response = await API.properties.create(propertyData);

    if (response.success) {
      // Upload images if any
      if (ListingState.formData.photos.length > 0) {
        await uploadPropertyImages(response.propertyId);
      }

      // Show success screen
      showScreen('list-success');
    } else {
      throw new Error(response.message || 'Failed to create listing');
    }

  } catch (error) {
    console.error('Error submitting property:', error);
    showFormError(`Failed to submit listing: ${error.message}`);
  } finally {
    // Reset loading state
    ListingState.formData.isSubmitting = false;
    if (submitBtn) {
      submitBtn.querySelector('.btn-text').style.display = 'flex';
      submitBtn.querySelector('.btn-loading').style.display = 'none';
      submitBtn.disabled = false;
    }
  }
}

/**
 * Prepare property data for submission
 */
function preparePropertyData() {
  return {
    type: ListingState.formData.propertyType,
    location: ListingState.formData.address,
    price: parseFloat(ListingState.formData.price.replace(/[^\d.]/g, '')),
    bedrooms: ListingState.formData.bedrooms,
    bathrooms: ListingState.formData.bathrooms || ListingState.formData.bedrooms,
    area: ListingState.formData.area,
    features: ListingState.formData.description,
    amenities: ListingState.formData.amenities,
    listing_type: ListingState.formData.listingType,
    contact_phone: ListingState.formData.phone,
    status: 'pending' // Will be verified by admin
  };
}

/**
 * Upload property images to Cloudinary
 */
async function uploadPropertyImages(propertyId) {
  if (ListingState.formData.photos.length === 0) return;

  try {
    const formData = new FormData();
    ListingState.formData.photos.forEach((photo, index) => {
      formData.append(`images`, photo.file);
    });

    // Add property ID to associate images
    formData.append('propertyId', propertyId);

    const response = await API.properties.uploadImages(formData);
    console.log('Images uploaded successfully:', response);

  } catch (error) {
    console.error('Error uploading images:', error);
    // Don't throw - property was created successfully, images are secondary
  }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Format price for display
 */
function formatPriceDisplay(price) {
  if (!price) return '';

  const numPrice = parseFloat(price.replace(/[^\d.]/g, ''));
  if (isNaN(numPrice)) return price;

  if (numPrice >= 1000000) {
    return `₦${(numPrice / 1000000).toFixed(1)}M`;
  } else if (numPrice >= 1000) {
    return `₦${(numPrice / 1000).toFixed(0)}K`;
  }
  return `₦${numPrice.toLocaleString()}`;
}

/**
 * Initialize listing form when screen is shown
 */
function initializeListingForm() {
  try {
    if (window.location.hash.includes('list-step')) {
      console.log('Initializing listing form for step:', ListingState.currentStep);

      // Sync state with HTML defaults
      syncStateWithHTML();

      // Initialize photo upload
      initializePhotoUpload();

      // Initialize form interactions
      initializeFormInteractions();

      // Update review screen if on step 4
      if (ListingState.currentStep === 4) {
        updateReviewScreen();
      }
    }
  } catch (error) {
    console.error('Error initializing listing form:', error);
  }
}

/**
 * Sync JavaScript state with HTML form defaults
 */
function syncStateWithHTML() {
  console.log('Syncing state with HTML...');

  // Sync bedroom selection
  const selectedBedrooms = document.querySelector('.bedroom-option.selected');
  if (selectedBedrooms) {
    ListingState.formData.bedrooms = parseInt(selectedBedrooms.dataset.bedrooms);
    console.log('Found selected bedrooms:', ListingState.formData.bedrooms);
  }

  // Sync listing type selection
  const selectedListingType = document.querySelector('.listing-option.selected');
  if (selectedListingType) {
    ListingState.formData.listingType = selectedListingType.dataset.listingType;
    console.log('Found selected listing type:', ListingState.formData.listingType);
  }

  // Sync property type selection
  const selectedType = document.querySelector('.type-option.selected');
  if (selectedType) {
    ListingState.formData.propertyType = selectedType.dataset.type;
    console.log('Found selected property type:', ListingState.formData.propertyType);
  }

  // Sync form inputs
  const addressInput = document.getElementById('propertyAddress');
  const phoneInput = document.getElementById('contactPhone');
  const priceInput = document.getElementById('propertyPrice');
  const areaInput = document.getElementById('propertyArea');
  const bathroomsInput = document.getElementById('propertyBathrooms');
  const descriptionInput = document.getElementById('propertyDescription');

  if (addressInput?.value) {
    ListingState.formData.address = addressInput.value;
    console.log('Found address:', ListingState.formData.address);
  }

  if (phoneInput?.value) {
    ListingState.formData.phone = phoneInput.value;
    console.log('Found phone:', ListingState.formData.phone);
  }

  if (priceInput?.value) {
    ListingState.formData.price = priceInput.value;
    console.log('Found price:', ListingState.formData.price);
  }

  if (areaInput?.value) {
    ListingState.formData.area = parseInt(areaInput.value);
    console.log('Found area:', ListingState.formData.area);
  }

  if (bathroomsInput?.value) {
    ListingState.formData.bathrooms = parseInt(bathroomsInput.value);
    console.log('Found bathrooms:', ListingState.formData.bathrooms);
  }

  if (descriptionInput?.value) {
    ListingState.formData.description = descriptionInput.value;
    console.log('Found description:', ListingState.formData.description);
  }

  // Sync amenities
  const checkedAmenities = document.querySelectorAll('.amenity-checkbox:checked');
  ListingState.formData.amenities = Array.from(checkedAmenities).map(cb => cb.value);
  console.log('Found amenities:', ListingState.formData.amenities);

  console.log('Final synced state:', ListingState.formData);
}

// ===================================
// INITIALIZATION
// ===================================

// Ensure functions are available globally immediately
window.nextStep = nextStep;
window.previousStep = previousStep;
window.submitPropertyListing = submitPropertyListing;
window.removePhoto = removePhoto;

// Simple fallback for back navigation
window.goBackFromListing = function() {
  console.log('Fallback back navigation called');

  // Check current step and navigate accordingly
  const currentScreen = document.querySelector('.screen.active')?.id;

  if (typeof previousStep === 'function') {
    console.log('Using listing previousStep function');
    // If on step 2, go to step 1
    if (currentScreen === 'list-step2') {
      previousStep('list-step1');
    }
    // If on step 3, go to step 2
    else if (currentScreen === 'list-step3') {
      previousStep('list-step2');
    }
    // If on step 4, go to step 3
    else if (currentScreen === 'list-step4') {
      previousStep('list-step3');
    }
    // Default fallback
    else {
      window.showScreen('list-step1');
    }
  } else {
    console.log('Using main app goBack function');
    // Ultimate fallback - use main app navigation
    if (typeof window.goBack === 'function') {
      window.goBack();
    } else {
      // Last resort - go to home
      window.showScreen('home');
    }
  }
};

// Listen for screen changes to initialize listing form
const originalShowScreen = window.showScreen;
if (originalShowScreen) {
  window.showScreen = function(screenId) {
    originalShowScreen(screenId);

    // Initialize listing form if on a listing screen
    if (screenId.startsWith('list-step')) {
      // Wait for DOM to be ready
      setTimeout(() => {
        try {
          initializeListingForm();
        } catch (error) {
          console.error('Error initializing listing form:', error);
        }
      }, 100);
    }
  };
}

// Also initialize when listing.js loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize if already on a listing screen
  if (window.location.hash && window.location.hash.includes('list-step')) {
    setTimeout(() => {
      try {
        initializeListingForm();
      } catch (error) {
        console.error('Error initializing listing form on load:', error);
      }
    }, 100);
  }
});

// ===================================
// EXPORT FUNCTIONS
// ===================================

window.initializeListingForm = initializeListingForm;
window.collectFormData = collectFormData;
window.updateReviewScreen = updateReviewScreen;
window.validateCurrentStep = validateCurrentStep;
window.syncStateWithHTML = syncStateWithHTML;
