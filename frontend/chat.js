/**
 * Chat Module - WhatsApp-style chat functionality
 * @module chat
 */

// ===================================
// CHAT STATE
// ===================================

const ChatState = {
  messages: [],
  userPhone: '',
  isTyping: false
};

// ===================================
// CHAT FUNCTIONALITY
// ===================================

/**
 * Initialize chat on whatsapp screen
 */
function initializeChat() {
  const chatInput = document.getElementById('chatInput');
  const chatWindow = document.getElementById('chatWindow');
  
  if (!chatWindow) return;
  
  // Clear existing messages except the welcome message
  const messages = chatWindow.querySelectorAll('.message');
  messages.forEach((msg, index) => {
    if (index > 0) msg.remove();
  });
  
  ChatState.messages = [];
  
  // Add event listener for Enter key
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

/**
 * Send chat message
 */
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const chatWindow = document.getElementById('chatWindow');
  
  if (!input || !chatWindow) return;
  
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message to UI
  addMessageToUI(message, 'user');
  
  // Clear input
  input.value = '';
  
  // Save message to state
  ChatState.messages.push({
    text: message,
    sender: 'user',
    timestamp: new Date()
  });
  
  // Show typing indicator
  showTypingIndicator(true);
  
  try {
    // Get user phone (from state or prompt)
    if (!ChatState.userPhone) {
      ChatState.userPhone = prompt('Please enter your phone number (e.g., +2348012345678)') || '+234';
    }

    // Send to API
    console.log('Sending message to API:', message);
    const response = await API.chat.sendMessage(message, ChatState.userPhone);
    console.log('Received API response:', response);

    // Hide typing indicator
    showTypingIndicator(false);

    // Handle different response types
    if (response) {
      setTimeout(() => {
        if (response.type === 'property_results' && response.properties) {
          console.log('Handling property results:', response.properties.length, 'properties');
          // Handle property results
          handlePropertyResults(response);
        } else if (response.response) {
          console.log('Handling text response:', response.response);
          // Handle simple text response
          addMessageToUI(response.response, 'bot');
          ChatState.messages.push({
            text: response.response,
            sender: 'bot',
            timestamp: new Date()
          });
        } else if (response.message) {
          console.log('Handling message response:', response.message);
          // Handle other structured responses
          addMessageToUI(response.message, 'bot');
          ChatState.messages.push({
            text: response.message,
            sender: 'bot',
            timestamp: new Date()
          });
        } else {
          console.error('No valid response type found in:', response);
          // Fallback for unexpected response format
          const fallbackMsg = 'I received your message but had trouble processing it. Can you try rephrasing?';
          addMessageToUI(fallbackMsg, 'bot');
        }
      }, 500);
    } else {
      console.error('No response received from API');
      setTimeout(() => {
        const errorMsg = 'Sorry, I\'m having trouble connecting right now. Please try again.';
        addMessageToUI(errorMsg, 'bot');
      }, 500);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showTypingIndicator(false);

    // Show error message with more helpful guidance
    setTimeout(() => {
      const errorMsg = '🤖 Sorry, I\'m having trouble connecting right now.\n\nPlease check your internet connection and try again. If the problem persists, you can also:\n\n• Use the "Find Property" option in the menu\n• Contact support: +234 805 526 9579';
      addMessageToUI(errorMsg, 'bot');
    }, 500);
  }
}

/**
 * Add message to chat UI
 * @param {string} text - Message text
 * @param {string} sender - 'user' or 'bot'
 */
function addMessageToUI(text, sender) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;
  
  // Remove typing indicator if exists
  const typingIndicator = chatWindow.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  
  // Convert markdown-style formatting to HTML
  let formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/\n/g, '<br>'); // Line breaks
  
  bubbleDiv.innerHTML = formattedText;
  messageDiv.appendChild(bubbleDiv);
  
  chatWindow.appendChild(messageDiv);
  
  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
  
  // Animate message in
  setTimeout(() => {
    messageDiv.style.opacity = '1';
  }, 10);
}

/**
 * Show/hide typing indicator
 * @param {boolean} show - Whether to show indicator
 */
function showTypingIndicator(show) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;
  
  // Remove existing indicator
  const existing = chatWindow.querySelector('.typing-indicator');
  if (existing) {
    existing.remove();
  }
  
  if (show) {
    const indicator = document.createElement('div');
    indicator.className = 'message bot typing-indicator';
    indicator.innerHTML = `
      <div class="message-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatWindow.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

/**
 * Handle property results response
 * @param {object} response - Backend response with properties
 */
function handlePropertyResults(response) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) {
    console.error('Chat window not found');
    return;
  }

  console.log('Handling property results:', response);

  // Add summary message
  if (response.summary) {
    addMessageToUI(response.summary, 'bot');
  }

  // Add each property as a card
  if (response.properties && response.properties.length > 0) {
    console.log('Adding', response.properties.length, 'property cards');
    response.properties.slice(0, 3).forEach((property, index) => {
      setTimeout(() => {
        console.log('Adding property card for:', property.type, property.location);
        addPropertyCardToChat(property);
      }, (index + 1) * 300); // Stagger the cards
    });
  } else {
    console.error('No properties found in response');
  }

  // Update chat state
  ChatState.messages.push({
    text: response.summary || 'Property results',
    sender: 'bot',
    timestamp: new Date(),
    type: 'property_results',
    properties: response.properties
  });
}

/**
 * Add property card to chat
 * @param {object} property - Property data
 */
function addPropertyCardToChat(property) {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) {
    console.error('Chat window not found in addPropertyCardToChat');
    return;
  }

  console.log('Creating property card for:', property.type, property.location);

  const cardDiv = document.createElement('div');
  cardDiv.className = 'message bot';

  const formattedPrice = formatPrice(property.price);
  const specs = [];

  if (property.area) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-area"></use></svg>${property.area}m²`);
  if (property.bedrooms) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bed"></use></svg>${property.bedrooms} Bed`);
  if (property.bathrooms) specs.push(`<svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-bath"></use></svg>${property.bathrooms} Bath`);

  cardDiv.innerHTML = `
    <div class="property-card-chat" onclick="viewPropertyDetail(${property.id})">
      <div class="property-image-chat">
        ${property.verified ? '<div class="verified-badge-chat"><svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-verified"></use></svg> Verified</div>' : ''}
        <svg class="icon icon-lg" viewBox="0 0 24 24"><use href="#icon-house"></use></svg> ${property.type || 'Property'}
      </div>
      <div class="property-details-chat">
        <div class="property-price-chat">
          <svg class="icon icon-sm icon-primary" viewBox="0 0 24 24"><use href="#icon-market"></use></svg>
          ${formattedPrice}
        </div>
        <div class="property-location-chat">
          <svg class="icon icon-sm icon-secondary" viewBox="0 0 24 24"><use href="#icon-location"></use></svg>
          ${property.type} • ${property.location}
        </div>
        ${specs.length > 0 ? `<div class="property-specs-chat">${specs.join(' • ')}</div>` : ''}
        ${property.features ? `<div class="property-features-chat"><svg class="icon icon-sm icon-primary" viewBox="0 0 24 24"><use href="#icon-star"></use></svg> ${property.features}</div>` : ''}
        <div class="property-actions-chat">
          <button class="property-action-btn" onclick="event.stopPropagation(); scheduleViewing(${property.id})">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-calendar"></use></svg>
            Schedule
          </button>
          <button class="property-action-btn" onclick="event.stopPropagation(); viewPropertyDetail(${property.id})">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><use href="#icon-view"></use></svg>
            View
          </button>
        </div>
      </div>
    </div>
  `;

  console.log('Appending card to chat window');
  chatWindow.appendChild(cardDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  console.log('Card added successfully');
}

/**
 * Format price for display
 * @param {string|number} price - Raw price
 * @returns {string} - Formatted price
 */
function formatPrice(price) {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'Price on request';

  if (numPrice >= 1000000) {
    return `₦${(numPrice / 1000000).toFixed(1)}M`;
  } else if (numPrice >= 1000) {
    return `₦${(numPrice / 1000).toFixed(0)}K`;
  }
  return `₦${numPrice.toLocaleString()}`;
}

/**
 * Handle quick reply button clicks
 * @param {string} replyText - Quick reply text
 */
function sendQuickReply(replyText) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = replyText;
    sendMessage();
  }
}

/**
 * Load chat history
 * @param {string} phone - User phone number
 */
async function loadChatHistory(phone) {
  try {
    const history = await API.chat.getHistory(phone);
    
    if (history && history.length > 0) {
      history.forEach(item => {
        if (item.message) {
          addMessageToUI(item.message, 'user');
        }
        if (item.response) {
          addMessageToUI(item.response, 'bot');
        }
      });
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

/**
 * Clear chat history
 */
function clearChat() {
  const chatWindow = document.getElementById('chatWindow');
  if (!chatWindow) return;
  
  if (confirm('Clear chat history?')) {
    // Keep only the welcome message
    const messages = chatWindow.querySelectorAll('.message');
    messages.forEach((msg, index) => {
      if (index > 0) msg.remove();
    });
    
    ChatState.messages = [];
  }
}

/**
 * Export chat state for debugging
 * @returns {object}
 */
function getChatState() {
  return ChatState;
}

// ===================================
// INITIALIZE ON WHATSAPP SCREEN
// ===================================

// Listen for screen changes to initialize chat
const originalShowScreen = window.showScreen;
if (originalShowScreen) {
  window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    if (screenId === 'whatsapp') {
      setTimeout(initializeChat, 100);
    }
  };
}

/**
 * View property detail (navigate to property detail screen)
 * @param {number} propertyId - Property ID
 */
function viewPropertyDetail(propertyId) {
  // Store the property ID for the detail screen
  localStorage.setItem('selectedPropertyId', propertyId);
  // Navigate to property detail screen
  if (window.showScreen) {
    window.showScreen('property-detail');
  }
}

/**
 * Schedule a viewing for a property
 * @param {number} propertyId - Property ID
 */
function scheduleViewing(propertyId) {
  // For now, just show an alert - this could be expanded to open a scheduling modal
  alert(`📅 Scheduling viewing for property #${propertyId}\n\nThis feature will be available soon!`);

  // In a real implementation, this would:
  // 1. Open a scheduling modal
  // 2. Show available time slots
  // 3. Send scheduling request to backend
  // 4. Send confirmation via WhatsApp
}

/**
 * Share property via WhatsApp or other platforms
 */
function shareProperty() {
  const property = AppState.selectedProperty;
  if (!property) return;

  const shareText = `🏠 Check out this amazing property!\n\n${property.type}\n📍 ${property.location}\n💰 ₦${property.price.toLocaleString()}/year\n\nView details: ${window.location.origin}`;

  if (navigator.share) {
    navigator.share({
      title: `${property.type} - ${property.location}`,
      text: shareText,
      url: window.location.href
    });
  } else {
    // Fallback to WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  }
}

/**
 * Navigate to previous image in gallery
 */
function previousImage() {
  console.log('Previous image');
}

/**
 * Navigate to next image in gallery
 */
function nextImage() {
  console.log('Next image');
}

// ===================================
// EXPORT FUNCTIONS
// ===================================

window.sendMessage = sendMessage;
window.sendQuickReply = sendQuickReply;
window.clearChat = clearChat;
window.getChatState = getChatState;
window.viewPropertyDetail = viewPropertyDetail;
window.scheduleViewing = scheduleViewing;

