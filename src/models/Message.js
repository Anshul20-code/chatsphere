const mongoose = require('mongoose');

// Definition of the Message Schema
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: [true, 'Receiver is required']
    },
    messageText: {
      type: String,
      required: [true, 'Message text cannot be empty'],
      trim: true
    }
  },
  {
    // Auto-generates createdAt and updatedAt.
    // The user's requirements ask for a 'timestamp', which will be represented by the 'createdAt' field or a custom 'timestamp' field.
    // We will set timestamps to true, which gives us 'createdAt' (effective timestamp).
    timestamps: true
  }
);

// Export the Message model
module.exports = mongoose.model('Message', messageSchema);
