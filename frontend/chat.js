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
    const response = await API.chat.sendMessage(message, ChatState.userPhone);

    // Hide typing indicator
    showTypingIndicator(false);

    // Handle different response types
    if (response) {
      setTimeout(() => {
        if (response.type === 'property_results' && response.properties) {
          // Handle property results
          handlePropertyResults(response);
        } else if (response.response) {
          // Handle simple text response
          addMessageToUI(response.response, 'bot');
          ChatState.messages.push({
            text: response.response,
            sender: 'bot',
            timestamp: new Date()
          });
        } else if (response.message) {
          // Handle other structured responses
          addMessageToUI(response.message, 'bot');
          ChatState.messages.push({
            text: response.message,
            sender: 'bot',
            timestamp: new Date()
          });
        }
      }, 500);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showTypingIndicator(false);

    // Show error message
    setTimeout(() => {
      const errorMsg = 'Sorry, I\'m having trouble connecting. Please try again.';
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
  if (!chatWindow) return;

  // Add summary message
  if (response.summary) {
    addMessageToUI(response.summary, 'bot');
  }

  // Add each property as a card
  if (response.properties && response.properties.length > 0) {
    response.properties.slice(0, 3).forEach((property, index) => {
      setTimeout(() => {
        addPropertyCardToChat(property);
      }, (index + 1) * 300); // Stagger the cards
    });
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
  if (!chatWindow) return;

  const cardDiv = document.createElement('div');
  cardDiv.className = 'message bot';

  const formattedPrice = formatPrice(property.price);
  const specs = [];

  if (property.area) specs.push(`${property.area}m²`);
  if (property.bedrooms) specs.push(`${property.bedrooms} Bed`);
  if (property.bathrooms) specs.push(`${property.bathrooms} Bath`);

  cardDiv.innerHTML = `
    <div class="property-card-chat" onclick="viewPropertyDetail(${property.id})">
      <div class="property-image-chat">
        ${property.verified ? '<div class="verified-badge-chat">✓ Verified</div>' : ''}
        ${property.type || 'Property'}
      </div>
      <div class="property-details-chat">
        <div class="property-price-chat">${formattedPrice}</div>
        <div class="property-location-chat">${property.type} • ${property.location}</div>
        ${specs.length > 0 ? `<div class="property-specs-chat">${specs.join(' • ')}</div>` : ''}
        <div class="property-actions-chat">
          <button class="property-action-btn" onclick="event.stopPropagation(); scheduleViewing(${property.id})">Schedule</button>
          <button class="property-action-btn" onclick="event.stopPropagation(); viewPropertyDetail(${property.id})">View</button>
        </div>
      </div>
    </div>
  `;

  chatWindow.appendChild(cardDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
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
  alert(`Scheduling viewing for property #${propertyId}. This feature will be available soon!`);

  // In a real implementation, this would:
  // 1. Open a scheduling modal
  // 2. Show available time slots
  // 3. Send scheduling request to backend
  // 4. Send confirmation via WhatsApp
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

