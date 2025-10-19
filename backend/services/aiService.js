const { GoogleGenerativeAI } = require('@google/generative-ai');
const Property = require('../models/Property');

// Initialize Google Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Processes a user message and determines the appropriate response
 * @param {string} message - The user's message
 * @param {string} phoneNumber - The user's phone number (for context)
 * @returns {Promise<object>} - The AI's response and any extracted entities
 */
const processMessage = async (message, phoneNumber) => {
  try {
    console.log('Processing message with Gemini:', message);

    // Step 1: Determine the intent of the message
    const intent = await determineIntent(message);
    console.log('Determined intent:', intent);

    // Step 2: Extract entities based on the intent
    const entities = await extractEntities(message, intent);
    console.log('Extracted entities:', entities);

    // Step 3: Generate a response based on the intent and entities
    const response = await generateResponse(intent, entities, phoneNumber);
    console.log('Generated response:', response);

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
 * Determines the intent of a user's message using Gemini
 * @param {string} message - The user's message
 * @returns {Promise<string>} - The determined intent
 */
const determineIntent = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp"});
    const prompt = `You are an AI assistant for a real estate platform called Propabridge. 
    Your job is to determine the intent of the user's message. 
    
    Possible intents:
    - greeting: When the user greets or says hello
    - search: When the user is looking for properties
    - inquire: When the user asks a question about a property or the service
    - appointment: When the user wants to schedule a viewing
    - other: For any other type of message
    
    Respond with only the intent keyword for this message: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const intent = response.text().trim().toLowerCase();
    
    return ['greeting', 'search', 'inquire', 'appointment'].includes(intent) ? intent : 'other';
  } catch (error) {
    console.error('Error determining intent:', error);
    return 'other';
  }
};

/**
 * Extracts relevant entities from the user's message based on intent
 * @param {string} message - The user's message
 * @param {string} intent - The determined intent
 * @returns {Promise<object>} - Extracted entities
 */
const extractEntities = async (message, intent) => {
  if (intent !== 'search') return {};

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp"});
    const prompt = `Extract real estate search parameters from the user's message. 
    Look for:
    - location: The desired location (e.g., "Lagos", "Abuja")
    - propertyType: Type of property (e.g., "apartment", "house", "land")
    - minPrice: Minimum price (as a number)
    - maxPrice: Maximum price (as a number)
    - bedrooms: Number of bedrooms (as a number)
    
    Return a JSON object with these fields. Only include fields that are explicitly mentioned.
    User message: "${message}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().replace(/```json\n|```/g, '').trim();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting entities:', error);
    return {};
  }
};

/**
 * Generates a response based on the intent and entities
 * @param {string} intent - The determined intent
 * @param {object} entities - Extracted entities
 * @param {string} phoneNumber - User's phone number for personalization
 * @returns {Promise<string>} - The generated response
 */
const generateResponse = async (intent, entities, phoneNumber) => {
  switch (intent) {
    case 'greeting':
      return "Hello! I'm your Propabridge assistant. How can I help you find your dream property today?";
    
    case 'search':
      try {
        // Search for properties based on extracted entities
        const properties = await Property.findByCriteria(entities);
        
        if (properties.length === 0) {
          return "I couldn't find any properties matching your criteria. Could you try different search terms?";
        }
        
        // Format the properties into a readable response
        let response = `I found ${properties.length} properties that match your criteria:\n\n`;
        
        properties.slice(0, 3).forEach((prop, index) => {
          response += `${index + 1}. ${prop.title}\n`;
          response += `   ${prop.location} - ${prop.price ? `₦${prop.price.toLocaleString()}` : 'Price on request'}\n`;
          if (prop.bedrooms) response += `   ${prop.bedrooms} bedroom${prop.bedrooms > 1 ? 's' : ''} | `;
          if (prop.bathrooms) response += `${prop.bathrooms} bathroom${prop.bathrooms > 1 ? 's' : ''} | `;
          if (prop.area) response += `${prop.area} sqm\n`;
          response += '\n';
        });
        
        if (properties.length > 3) {
          response += `\nAnd ${properties.length - 3} more properties. Would you like to see more details about any of these?`;
        } else {
          response += "\nWould you like more information about any of these properties?";
        }
        
        return response;
      } catch (error) {
        console.error('Error searching properties:', error);
        return "I'm having trouble searching for properties right now. Please try again later.";
      }
    
    case 'inquire':
      return "I'm here to help with any questions you have about our properties or services. What would you like to know?";
    
    case 'appointment':
      return "I'd be happy to schedule a viewing for you. Could you please let me know your preferred date and time?";
    
    default:
      return "I'm not sure I understand. Could you please rephrase your request? I can help you find properties, answer questions, or schedule viewings.";
  }
};

module.exports = {
  processMessage,
  determineIntent,
  extractEntities,
  generateResponse,
};
