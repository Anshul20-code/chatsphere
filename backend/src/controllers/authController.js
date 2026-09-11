const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate a JSON Web Token
// Takes the user's ID as the payload and signs it using the secret key from .env
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token will expire in 30 days
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Simple request body validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // Check if the user already exists by email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Check if the username is already taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Create and save new user in database. Note: the pre-save hook in User.js will hash the password.
    const user = await User.create({
      username,
      email,
      password
    });

    if (user) {
      // Respond with the newly created user info and a generated token
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request parameters
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Look for user by email address
    const user = await User.findOne({ email });

    // If user exists and entered password matches database hashed password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      // Return 401 Unauthorized for incorrect email or password
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = {
  signup,
  login
};
