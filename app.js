require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const { processWhatsAppPayload } = require('./utils/payloadProcessor');

const app = express();
const server = http.createServer(app);
require('./socket/socket')(server);

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large payloads

app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook payload:', {
      payload_type: req.body.payload_type,
      _id: req.body._id,
      timestamp: new Date().toISOString()
    });

    await processWhatsAppPayload(req.body);
    
    console.log('Webhook processed successfully');
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));