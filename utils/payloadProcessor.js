const Message = require('../models/Message');

exports.processWhatsAppPayload = async (payload) => {
  try {
    const entry = payload?.metaData?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    if (!change) {
      console.warn('Invalid WhatsApp payload format');
      return;
    }

    // Handle incoming messages
    const messages = change.messages || [];
    const contacts = change.contacts || [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const contact = contacts[i] || {};

      const newMsg = new Message({
        from: msg.from,
        to: 'me',
        text: msg.text?.body || '',
        timestamp: new Date(Number(msg.timestamp) * 1000),
        status: msg.status || 'sent',
        senderName: contact.profile?.name || 'Unknown',
        messageId: msg.id // <-- Store WhatsApp ID for updates
      });

      await newMsg.save();
    }

    // Handle status updates
    const statuses = change.statuses || [];
    for (const statusUpdate of statuses) {
      const messageId = statusUpdate.meta_msg_id;
      const status = statusUpdate.status;

      if (messageId && status) {
        await Message.findOneAndUpdate(
          { messageId },
          {
            $set: {
              status: status,
            }
          }
        );
      }
    }

  } catch (err) {
    console.error('Payload processing error:', err);
  }
};
