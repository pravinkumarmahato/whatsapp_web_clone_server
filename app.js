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
const io = require('./socket/socket')(server);

// Make io instance available to controllers
app.locals.io = io;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Webhook route
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

// Health check routes
app.get('/', (req, res) => {
  res.send('WhatsApp Web Clone Server is running 🚀');
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Start server immediately for Render health check
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  connectToDB(); // Connect to DB after server starts
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// MongoDB connection (non-blocking startup)
async function connectToDB() {
  try {
    mongoose.set('autoIndex', false); // Avoid duplicate index in production
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    // Don't exit immediately — allow health checks to pass
  }
}
