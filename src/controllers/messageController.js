const Message = require('../models/Message');

/**
 * @desc    Get chat history between current user and another user
 * @route   GET /api/messages/:otherUserId
 * @access  Private (Requires auth token)
 */
const getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.otherUserId;

    // Validate that otherUserId is provided
    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID must be provided' });
    }

    // Retrieve messages where:
    // 1. Current user is sender and Other user is receiver, OR
    // 2. Other user is sender and Current user is receiver
    const chatHistory = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 }) // Sort chronologically (oldest messages first)
      .populate('sender', 'username email') // Option to populate sender details
      .populate('receiver', 'username email'); // Option to populate receiver details

    res.json(chatHistory);
  } catch (error) {
    console.error('Fetch Chat History Error:', error.message);
    res.status(500).json({ message: 'Server error. Could not retrieve chat history.' });
  }
};

module.exports = {
  getChatHistory
};
