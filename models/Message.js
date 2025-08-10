const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  senderName: String,
  messageId: { type: String, unique: true },
}, {
  collection: 'processed_messages'
});

messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ messageId: 1 }, { unique: true });

module.exports = mongoose.model('Message', messageSchema);