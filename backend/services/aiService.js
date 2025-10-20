const { GoogleGenerativeAI } = require('@google/generative-ai');
const Property = require('../models/Property');
const matchingService = require('./matchingService');

// Initialize Google Gemini with API key from environment variables
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// In-memory conversation context (use Redis in production for scalability)
const conversationContext = new Map();

/**
 * Get conversation context for a user
 * @param {string} phoneNumber - User's phone number
 * @returns {array} - Last 5 messages
 */
const getContext = (phoneNumber) => {
  return conversationContext.get(phoneNumber) || [];
};

/**
 * Save message to conversation context
 * @param {string} phoneNumber - User's phone number
 * @param {object} messageData - Message data to store
 */
const saveContext = (phoneNumber, messageData) => {
  const context = conversationContext.get(phoneNumber) || [];
  context.push({
    ...messageData,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 5 messages
  if (context.length > 5) {
    context.shift();
  }
  
  conversationContext.set(phoneNumber, context);
};

/**
 * Clear conversation context for a user
 * @param {string} phoneNumber - User's phone number
 */
const clearContext = (phoneNumber) => {
  conversationContext.delete(phoneNumber);
};

/**
 * Processes a user message and determines the appropriate response
 * @param {string} message - The user's message
 * @param {string} phoneNumber - The user's phone number (for context)
 * @returns {Promise<object>} - The AI's response and any extracted entities
 */
const processMessage = async (message, phoneNumber) => {
  try {
    console.log('Processing message with Gemini:', message);

    // Get conversation history for context
    const context = getContext(phoneNumber);
    console.log(`Conversation history: ${context.length} messages`);

    // Step 1: Determine the intent of the message
    const intent = await determineIntent(message, context);
    console.log('Determined intent:', intent);

    // Step 2: Extract entities based on the intent
    const entities = await extractEntities(message, intent, context);
    console.log('Extracted entities:', entities);

    // Step 3: Generate a response based on the intent and entities
    const response = await generateResponse(intent, entities, phoneNumber, context);
    console.log('Generated response:', response);

    // Save to context
    saveContext(phoneNumber, {
      message,
      intent,
      entities,
      response
    });

    return {
      intent,
      entities,
      response,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in processMessage:', error);
    return {
      intent: 'error',
      entities: {},
      response: 'Sorry, I encountered an error processing your request. Please try again later.',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Determines the intent of a user's message using Gemini with context awareness
 * @param {string} message - The user's message
 * @param {array} context - Conversation history
 * @returns {Promise<string>} - The determined intent
 */
const determineIntent = async (message, context = []) => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp"});
    
    // Build context string
    const contextStr = context.length > 0 
      ? `Previous conversation:\n${context.map(c => `User: ${c.message}\nBot: ${c.response}`).join('\n')}\n\n`
      : '';
    
    const prompt = `You are an AI assistant for a real estate platform called Propabridge in Nigeria. 
    Your job is to determine the intent of the user's message. 
    
    ${contextStr}
    Possible intents:
    - greeting: When the user greets (hi, hello, hey, good morning, etc.)
    - search: When the user is looking for properties (mentions location, bedrooms, price, property type)
    - inquire_specific: When asking about a specific property by ID or previously mentioned
    - schedule_viewing: When user wants to see/visit a property ('when can I see', 'book viewing', 'schedule appointment')
    - price_negotiation: When discussing price ('too expensive', 'can we negotiate', 'lower price', 'discount')
    - list_property: When user wants to list their property ('I want to list', 'I have a property', 'I\'m a landlord')
    - show_more: When user wants to see more results ('show me more', 'any others', 'next')
    - other: For any other type of message
    
    Current message: "${message}"
    
    Respond with ONLY the intent keyword (nothing else).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const intent = response.text().trim().toLowerCase();
    
    const validIntents = ['greeting', 'search', 'inquire_specific', 'schedule_viewing', 'price_negotiation', 'list_property', 'show_more', 'other'];
    return validIntents.includes(intent) ? intent : 'other';
  } catch (error) {
    console.error('Error determining intent:', error);
    throw error;
  }
};


/**
 * Extracts relevant entities from the user's message based on intent with context
 * @param {string} message - The user's message
 * @param {string} intent - The determined intent
 * @param {array} context - Conversation history
 * @returns {Promise<object>} - Extracted entities
 */
const extractEntities = async (message, intent, context = []) => {
  if (!['search', 'show_more'].includes(intent)) return {};

  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp"});
    
    // Build context string to inherit previous search criteria
    const contextStr = context.length > 0 
      ? `Previous search criteria: ${JSON.stringify(context[context.length - 1]?.entities || {})}\n`
      : '';
    
    const prompt = `Extract real estate search parameters from the user's message for Nigerian properties.
    
    ${contextStr}
    Look for:
    - location: Desired location (support abbreviations: 'GRA' = 'Gwarinpa', 'V.I' = 'Victoria Island', 'Wuse' = 'Wuse 2')
    - propertyType: Type of property (flat, apartment, duplex, detached, terrace, land, commercial)
    - minPrice: Minimum price in Naira (handle formats like '2M' = 2000000, '2.5M' = 2500000, '2-3M' means minPrice=2000000, maxPrice=3000000)
    - maxPrice: Maximum price in Naira (same format rules)
    - bedrooms: Number of bedrooms (handle formats like '2bed', 'two bedroom', '2br', 'at least 3' = 3)
    - amenities: List of requested amenities (parking, pool, gym, security, power, water, gated, bq)
    
    If user says 'show more' or 'any others', use the previous search criteria from context.
    
    Return ONLY a valid JSON object with these fields. Only include fields that are mentioned or can be inferred from context.
    
    User message: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().replace(/```json\n|```/g, '').trim();
    const entities = JSON.parse(content);
    
    // Handle location abbreviations
    const locationAliases = {
      'gra': 'Gwarinpa',
      'v.i': 'Victoria Island',
      'vi': 'Victoria Island',
      'wuse': 'Wuse 2',
      'leki': 'Lekki',
      'ikoyi': 'Ikoyi'
    };
    
    if (entities.location) {
      const locationLower = entities.location.toLowerCase();
      for (const [alias, full] of Object.entries(locationAliases)) {
        if (locationLower.includes(alias)) {
          entities.location = full;
          break;
        }
      }
    }
    
    return entities;
  } catch (error) {
    console.error('Error extracting entities:', error);
    throw error;
  }
};


/**
 * Format property for WhatsApp message
 * @param {object} property - Property object
 * @param {number} index - Property index for numbering
 * @returns {string} - Formatted property text
 */
const formatPropertyForWhatsApp = (property, index) => {
  const verified = property.verified ? '✅ Verified' : '';
  const matchScore = property.matchScore ? ` (${property.matchScore}% match)` : '';
  
  let response = `*${index}. ${property.type}* ${verified}${matchScore}\n`;
  response += `📍 ${property.location}\n`;
  response += `💰 ₦${property.price.toLocaleString()}/year\n`;
  response += `🛏️ ${property.bedrooms} bed | 🚿 ${property.bathrooms || property.bedrooms} bath`;
  if (property.area) response += ` | 📐 ${property.area}m²`;
  response += '\n';
  if (property.features) {
    const features = property.features.split(',').slice(0, 3).join(',');
    response += `✨ ${features}\n`;
  }
  response += `🆔 Property ID: ${property.id}\n`;
  
  return response;
};

/**
 * Generates a response based on the intent and entities
 * @param {string} intent - The determined intent
 * @param {object} entities - Extracted entities
 * @param {string} phoneNumber - User's phone number for personalization
 * @param {array} context - Conversation history
 * @returns {Promise<string>} - The generated response
 */
const generateResponse = async (intent, entities, phoneNumber, context = []) => {
  switch (intent) {
    case 'greeting':
      return "👋 Hello! I'm your Propabridge assistant.\n\nI can help you:\n• Find properties in Nigeria\n• Schedule viewings\n• List your property\n\nWhat would you like to do?";
    
    case 'search':
    case 'show_more':
      try {
        // Use smart matching service for better results
        const properties = await matchingService.findMatches(entities);
        
        if (properties.length === 0) {
          // Get smart suggestions
          const suggestions = await matchingService.getSmartSuggestions(entities);
          let response = "😔 No exact matches found for your criteria.\n\n";
          
          if (suggestions.nearbyAreas.length > 0) {
            response += "🔍 *Nearby Areas:*\n";
            suggestions.nearbyAreas.forEach((prop, i) => {
              response += formatPropertyForWhatsApp(prop, i + 1);
            });
          } else if (suggestions.cheaperOptions.length > 0) {
            response += "💡 *More Affordable Options:*\n";
            suggestions.cheaperOptions.forEach((prop, i) => {
              response += formatPropertyForWhatsApp(prop, i + 1);
            });
          } else {
            response += "Try:\n• Different location\n• Adjusting your budget\n• Fewer bedrooms\n\nWhat would you like to search for?";
          }
          
          return response;
        }
        
        // For frontend: return property data instead of formatted text
        // This will be handled by the frontend to display property cards
        return {
          type: 'property_results',
          properties: properties,
          summary: `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'} matching your search!`
        };
      } catch (error) {
        console.error('Error searching properties:', error);
        return "⚠️ I'm having trouble searching right now. Please try again in a moment.";
      }
    
    case 'inquire_specific':
      return "I'd be happy to share details about that property! Could you tell me the Property ID or which one you're interested in (1st, 2nd, etc.)?";
    
    case 'schedule_viewing':
      return "📅 Great! I'll connect you with the landlord to schedule a viewing.\n\nWhich property are you interested in? (Send the Property ID)";
    
    case 'price_negotiation':
      return "💬 I understand! Property prices are often negotiable. I can connect you with the landlord to discuss the price.\n\nWhich property would you like to negotiate on?";
    
    case 'list_property':
      return "🏠 Excellent! I can help you list your property.\n\nTo get started, I'll need:\n1. Property location\n2. Number of bedrooms\n3. Annual rent price\n4. Photos (optional)\n\nReply with these details or visit our website to list: propabridge.ng/list";
    
    default:
      return "🤔 I'm not quite sure what you mean. I can help you:\n\n• *Search* for properties (e.g., '3 bedroom flat in Lekki under 3M')\n• *Schedule viewings*\n• *List your property*\n\nWhat would you like to do?";
  }
};

module.exports = {
  processMessage,
  determineIntent,
  extractEntities,
  generateResponse,
  getContext,
  saveContext,
  clearContext,
  formatPropertyForWhatsApp
};
