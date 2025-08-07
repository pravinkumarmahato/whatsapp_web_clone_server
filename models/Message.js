const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  timestamp: Date,
  status: String,
  senderName: String,
  messageId: String,
  }, {
  collection: 'processed_messages'
});

module.exports = mongoose.model('Message', messageSchema);