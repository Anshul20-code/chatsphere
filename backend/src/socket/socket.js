const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

// In-memory mapping of online users: Map<UserIdString, Set<SocketId>>
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
    const uid = String(socket.userId);
    console.log(`User connected: Socket ID = ${socket.id}, User ID = ${uid}`);

    // Map the user ID string to a Set of socket IDs to support multiple connections/tabs
    if (!onlineUsers.has(uid)) {
      onlineUsers.set(uid, new Set());
    }
    onlineUsers.get(uid).add(socket.id);

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

        const targetReceiverId = String(receiverId?._id || receiverId);

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

        // 3. Emit message back to sender's active sockets
        const senderSocketIds = onlineUsers.get(String(socket.userId));
        if (senderSocketIds) {
          for (const sId of senderSocketIds) {
            io.to(sId).emit('receiveMessage', populatedMessage);
          }
        } else {
          socket.emit('receiveMessage', populatedMessage);
        }

        // 4. If the receiver is online, emit the message to all their active sockets
        const receiverSocketIds = onlineUsers.get(targetReceiverId);
        if (receiverSocketIds && receiverSocketIds.size > 0) {
          for (const sId of receiverSocketIds) {
            io.to(sId).emit('receiveMessage', populatedMessage);
          }
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

      const targetReceiverId = String(receiverId?._id || receiverId);
      const receiverSocketIds = onlineUsers.get(targetReceiverId);

      if (receiverSocketIds && receiverSocketIds.size > 0) {
        for (const sId of receiverSocketIds) {
          io.to(sId).emit('typingStatus', {
            senderId: socket.userId,
            isTyping: isTyping
          });
        }
      }
    });

    // Event: disconnect
    // Fired when the client closes the connection (e.g. closes browser/tab)
    socket.on('disconnect', () => {
      console.log(`User disconnected: Socket ID = ${socket.id}, User ID = ${socket.userId}`);
      
      const userSockets = onlineUsers.get(uid);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(uid);
        }
      }

      // Broadcast the updated list of online user IDs
      io.emit('onlineUsersList', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = { initSocket };
