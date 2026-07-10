const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Map getChatHistory to GET /api/messages/:otherUserId
// This route is protected by the 'protect' middleware
router.get('/:otherUserId', protect, getChatHistory);

module.exports = router;
