const Message = require('../models/Message');

exports.getAllConversations = async (req, res) => {
  try {
    const messages = await Message.find();
    const conversationsMap = new Map();
    messages.forEach((msg) => {
      const key = msg.from === 'me' ? msg.to : msg.from;
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
    const userId = req.params.id;
    const messages = await Message.find({ $or: [ { from: userId }, { to: userId } ] });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const { from, to, text } = req.body;
    const message = new Message({ from, to, text, timestamp: new Date(), status: 'sent' });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};