const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware function to protect api routes using JWT
const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Split the header to get the actual token value: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using the secret key from .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user associated with the token (excluding the password field for security)
      // and attach the user object to the request (req.user)
      req.user = await User.findById(decoded.id).select('-password');

      // If user does not exist in the database (e.g. account deleted after token issued)
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Proceed to the next middleware or controller function
      next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      // Return 401 Unauthorized if the token signature is invalid or expired
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  // If no token was found in the headers
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
