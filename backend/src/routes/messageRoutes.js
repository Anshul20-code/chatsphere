const express = require('express');
const router = express.Router();
const { getChatHistory, clearChatHistory, getLastMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/messages/last-messages (Fetch all conversation previews)
router.get('/last-messages', protect, getLastMessages);

// Map getChatHistory to GET /api/messages/:otherUserId
router.get('/:otherUserId', protect, getChatHistory);

// Map clearChatHistory to DELETE /api/messages/:otherUserId
router.delete('/:otherUserId', protect, clearChatHistory);

module.exports = router;
