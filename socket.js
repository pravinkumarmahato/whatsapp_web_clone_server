const { Server } = require('socket.io');
const Message = require('./models/Message');

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('sendMessage', async (data) => {
      const { from, to, text } = data;
      const message = new Message({ from, to, text, timestamp: new Date(), status: 'sent' });
      await message.save();
      io.emit('message', message);
    });
  });
};