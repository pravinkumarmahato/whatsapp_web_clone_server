
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Message = require('../models/Message');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth token missing'));

    try {
      const user = jwt.verify(token, JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const phone = socket.user.phone;
    socket.join(phone);
    console.log(`User connected: ${phone}`);

    // --- Handle sending messages ---
    socket.on('sendMessage', async (data) => {
      const { to, text } = data;
      const from = phone;

      const message = new Message({ from, to, text, timestamp: new Date(), status: 'sent' });
      await message.save();

      // Emit to sender
      io.to(from).emit('message', message);

      // Emit to receiver if online
      const receiverSockets = await io.in(to).fetchSockets();
      if (receiverSockets.length > 0) {
        // Update status to 'delivered' if receiver is connected
        message.status = 'delivered';
        await message.save();

        io.to(to).emit('message', message);
      }
    });

    // --- Handle read receipts ---
    socket.on('messageRead', async (data) => {
      const { messageId } = data;
      const updated = await Message.findOneAndUpdate(
        { messageId, to: phone },
        { $set: { status: 'read' } },
        { new: true }
      );
      if (updated) {
        io.to(updated.from).emit('messageStatusUpdated', {
          messageId: updated.messageId,
          status: 'read',
        });
      }
    });
  });
};