const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Route for WhatsApp webhook verification
router.get('/webhook', whatsappController.verifyWebhook);

// Route for receiving WhatsApp messages
router.post('/webhook', whatsappController.handleWebhook);

module.exports = router;
