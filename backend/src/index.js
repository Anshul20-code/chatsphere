const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import routers
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');

// Import socket setup
const { initSocket } = require('./socket/socket');

// Initialize Express App
const app = express();

// Set up Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON payloads in request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// Define basic health check/landing route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ChatSphere API. Server is running!' });
});

// Register api endpoints
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Global Error Handler Middleware (acts as a safety net)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred'
  });
});

// Create the HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.io on the HTTP server
initSocket(server);

// Retrieve port from .env or default to 5000
const PORT = process.env.PORT || 5000;

// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB database successfully');
    
    // Start the server only after a successful database connection
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.io server is initialized and ready`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit the application with failure code
  });
