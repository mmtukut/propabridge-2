const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const aiService = require('../services/aiService');

// Route for WhatsApp webhook verification
router.get('/webhook', whatsappController.verifyWebhook);

// Route for receiving WhatsApp messages
router.post('/webhook', whatsappController.handleWebhook);

// Route for frontend chat API
router.post('/chat', async (req, res) => {
  try {
    const { message, phone } = req.body;
    
    if (!message || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Message and phone number are required'
      });
    }

    // Process message with AI service
    const result = await aiService.processMessage(message, phone);
    
    // Check if response contains property data
    if (result.response && typeof result.response === 'object' && result.response.type === 'property_results') {
      res.status(200).json({
        success: true,
        response: result.response.summary,
        intent: result.intent,
        entities: result.entities,
        properties: result.response.properties,
        hasPropertyData: true
      });
    } else {
      res.status(200).json({
        success: true,
        response: result.response,
        intent: result.intent,
        entities: result.entities,
        hasPropertyData: false
      });
    }
  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

module.exports = router;
