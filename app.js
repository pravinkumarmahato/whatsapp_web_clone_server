require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const messageRoutes = require('./routes/messageRoutes');
const { processWhatsAppPayload } = require('./utils/payloadProcessor');

const app = express();
const server = http.createServer(app);
require('./socket')(server);

app.use(cors());
app.use(express.json());

app.post('/webhook', async (req, res) => {
  await processWhatsAppPayload(req.body);
  res.sendStatus(200);
});

app.use('/api/messages', messageRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err));