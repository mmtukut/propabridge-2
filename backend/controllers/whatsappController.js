const whatsappService = require('../services/whatsappService');

// Handle webhook verification
const verifyWebhook = (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === verifyToken) {
      // Respond with 200 OK and challenge token from the request
      console.log('✅ Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.error('❌ Webhook verification failed: Invalid token.');
      res.sendStatus(403);
    }
  } else {
    // Responds with '400 Bad Request' if mode or token is missing
    console.error('❌ Webhook verification failed: Missing mode or token.');
    res.sendStatus(400);
  }
};

// Handle incoming webhook events
const handleWebhook = async (req, res) => {
  try {
    const body = req.body;
    
    console.log('=== INCOMING WEBHOOK REQUEST ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(body, null, 2));

    // Check if this is an event from a page subscription
    if (body.object === 'whatsapp_business_account') {
      console.log('Processing WhatsApp Business Account event');
      
      // Check if this is a message event
      if (body.entry && body.entry.length > 0) {
        console.log(`Processing ${body.entry.length} entries`);
        
        // Iterate over each entry - there may be multiple if batched
        for (const entry of body.entry) {
          console.log('Processing entry:', entry.id);
          
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              console.log('Processing change:', change.field);
              
              // Check for a message object
              if (change.value && change.value.messages && change.value.messages.length > 0) {
                const message = change.value.messages[0];
                console.log('Processing message from:', message.from);
                
                if (message) {
                  try {
                    // Process the incoming message
                    await whatsappService.handleIncomingMessage(message);
                    console.log('Successfully processed message');
                  } catch (error) {
                    console.error('Error processing message:', error);
                    console.error('Message that caused error:', JSON.stringify(message, null, 2));
                  }
                }
              } else {
                console.log('No messages in this change, metadata:', 
                  JSON.stringify({
                    hasMessages: !!(change.value && change.value.messages),
                    messageCount: (change.value && change.value.messages) ? change.value.messages.length : 0,
                    changeValue: change.value ? Object.keys(change.value) : 'no change value'
                  }, null, 2)
                );
              }
            }
          } else {
            console.log('No changes in this entry');
          }
        }
      } else {
        console.log('No entries in webhook payload');
      }

      // Return a '200 OK' response to let Meta know you've received the callback
      console.log('=== WEBHOOK PROCESSING COMPLETE ===\n');
      res.sendStatus(200);
    } else {
      // Return a '404 Not Found' if event is not from a page subscription
      console.log('Webhook received but not a WhatsApp Business Account event');
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('ERROR in handleWebhook:', error);
    console.error('Request body that caused the error:', JSON.stringify(req.body, null, 2));
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  verifyWebhook,
  handleWebhook,
};
