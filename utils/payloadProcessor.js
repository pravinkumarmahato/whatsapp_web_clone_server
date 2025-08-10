const Message = require('../models/Message');

exports.processWhatsAppPayload = async (payload) => {
  try {
    console.log('Processing WhatsApp payload:', JSON.stringify(payload, null, 2));

    // Validate payload structure
    if (!payload || payload.payload_type !== 'whatsapp_webhook') {
      console.warn('Invalid payload type or missing payload_type');
      return;
    }

    const entry = payload?.metaData?.entry?.[0];
    if (!entry) {
      console.warn('No entry found in payload');
      return;
    }

    const change = entry?.changes?.[0]?.value;
    if (!change) {
      console.warn('No changes found in payload');
      return;
    }

    // Handle incoming messages
    if (change.messages && Array.isArray(change.messages)) {
      await processMessages(change.messages, change.contacts || []);
    }

    // Handle status updates
    if (change.statuses && Array.isArray(change.statuses)) {
      await processStatusUpdates(change.statuses);
    }

  } catch (err) {
    console.error('Payload processing error:', err);
  }
};

async function processMessages(messages, contacts) {
  console.log(`Processing ${messages.length} messages`);
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const contact = contacts.find(c => c.wa_id === msg.from) || {};

    try {
      // Check if message already exists
      const exists = await Message.exists({ messageId: msg.id });
      if (exists) {
        console.log(`Message ${msg.id} already exists, skipping`);
        continue;
      }

      // Create new message
      const newMsg = new Message({
        from: msg.from,
        to: contact.wa_id || 'Unknown',
        text: msg.text?.body || '',
        timestamp: new Date(Number(msg.timestamp) * 1000),
        status: 'sent',
        senderName: contact.profile?.name || 'Unknown',
        messageId: msg.id
      });

      await newMsg.save();
      console.log(`Saved message: ${msg.id} from ${msg.from}`);

    } catch (err) {
      console.error(`Error processing message ${msg.id}:`, err);
    }
  }
}

async function processStatusUpdates(statuses) {
  console.log(`Processing ${statuses.length} status updates`);
  
  for (const statusUpdate of statuses) {
    try {
      const messageId = statusUpdate.meta_msg_id || statusUpdate.id;
      const status = statusUpdate.status;

      if (!messageId || !status) {
        console.warn('Missing messageId or status in status update:', statusUpdate);
        continue;
      }

      // Update message status
      const updated = await Message.findOneAndUpdate(
        { messageId },
        { $set: { status } },
        { new: true }
      );

      if (updated) {
        console.log(`Updated message ${messageId} status to ${status}`);
      } else {
        console.warn(`Status update failed: messageId ${messageId} not found`);
      }

    } catch (err) {
      console.error(`Error processing status update:`, err);
    }
  }
}