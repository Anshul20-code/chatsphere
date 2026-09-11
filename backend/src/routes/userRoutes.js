const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Map getAllUsers to GET /api/users/
// This route is protected by the 'protect' middleware to ensure only logged-in users access it
router.get('/', protect, getAllUsers);

module.exports = router;
