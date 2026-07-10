const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

// Map signup controller to POST /api/auth/signup
router.post('/signup', signup);

// Map login controller to POST /api/auth/login
router.post('/login', login);

module.exports = router;
