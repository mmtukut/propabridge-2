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
    
    // Add bot response to UI
    if (response && response.response) {
      setTimeout(() => {
        addMessageToUI(response.response, 'bot');
        ChatState.messages.push({
          text: response.response,
          sender: 'bot',
          timestamp: new Date()
        });
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

// ===================================
// EXPORT FUNCTIONS
// ===================================

window.sendMessage = sendMessage;
window.sendQuickReply = sendQuickReply;
window.clearChat = clearChat;
window.getChatState = getChatState;

