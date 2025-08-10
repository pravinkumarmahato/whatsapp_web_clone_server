const Message = require('../models/Message');

exports.getAllConversations = async (req, res) => {
  try {
    const self = req.user.phone;
    const messages = await Message.find({ $or: [ { from: self }, { to: self } ] });
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const key = msg.from === self ? msg.to : msg.from;
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          wa_id: key,
          name: key,
          messages: [],
        });
      }
      conversationsMap.get(key).messages.push(msg);
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessagesByUser = async (req, res) => {
  try {
    const self = req.user.phone;
    const userId = req.params.id;
    const messages = await Message.find({
      $or: [
        { from: self, to: userId },
        { from: userId, to: self },
      ],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { to, text } = req.body;
    const from = req.user.phone;
    const senderName = req.user.name || 'Unknown';

    const message = new Message({ from, to, text, timestamp: new Date(), status: 'sent', senderName });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};