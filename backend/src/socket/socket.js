const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// In-memory mapping of online users: Map<UserId, SocketId>
const onlineUsers = new Map();

/**
 * Initializes and configures Socket.io on the HTTP server
 * @param {object} server - HTTP Server instance
 */
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for testing. In production, restrict this.
      methods: ['GET', 'POST']
    }
  });

  // Socket.io Middleware to authenticate incoming socket connections
  io.use((socket, next) => {
    // The client can send the token in the authentication payload or query parameters
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // Reject connection if token is missing
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Store the authenticated user's ID on the socket instance as a string
      socket.userId = String(decoded.id);
      next();
    } catch (error) {
      console.error('Socket Auth Error:', error.message);
      return next(new Error('Authentication error: Token is invalid'));
    }
  });

  // Event listener for a successful client connection
  io.on('connection', (socket) => {
    console.log(`User connected: Socket ID = ${socket.id}, User ID = ${socket.userId}`);

    // Map the user ID string to the socket ID to track online status
    onlineUsers.set(String(socket.userId), socket.id);

    // Broadcast the updated list of online user IDs to all connected clients
    io.emit('onlineUsersList', Array.from(onlineUsers.keys()));

    /**
     * Event: sendMessage
     * Payload: { receiverId, messageText }
     * Saves the message to the DB and emits it to the receiver and sender
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { receiverId, messageText } = data;

        if (!receiverId || !messageText) {
          return socket.emit('error', { message: 'receiverId and messageText are required' });
        }

        const targetReceiverId = String(receiverId);

        // 1. Save message to MongoDB
        const newMessage = await Message.create({
          sender: socket.userId,
          receiver: targetReceiverId,
          messageText: messageText
        });

        // 2. Format message with populated sender & receiver details
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('sender', 'username email')
          .populate('receiver', 'username email');

        // 3. Emit message back to sender
        socket.emit('receiveMessage', populatedMessage);

        // 4. If the receiver is online, emit the message to their socket
        const receiverSocketId = onlineUsers.get(targetReceiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', populatedMessage);
        }
      } catch (error) {
        console.error('Socket SendMessage Error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Event: typing
     * Payload: { receiverId, isTyping }
     * Relays typing indicator status to the specific recipient
     */
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;

      if (!receiverId) return;

      const targetReceiverId = String(receiverId);
      const receiverSocketId = onlineUsers.get(targetReceiverId);

      if (receiverSocketId) {
        // Emit 'typingStatus' event to the receiver with the sender's details
        io.to(receiverSocketId).emit('typingStatus', {
          senderId: socket.userId,
          isTyping: isTyping
        });
      }
    });

    // Event: disconnect
    // Fired when the client closes the connection (e.g. closes browser)
    socket.on('disconnect', () => {
      console.log(`User disconnected: Socket ID = ${socket.id}, User ID = ${socket.userId}`);
      
      // Remove user from the online users map
      onlineUsers.delete(socket.userId);

      // Broadcast the updated list of online user IDs
      io.emit('onlineUsersList', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = { initSocket };
