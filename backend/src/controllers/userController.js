const User = require('../models/User');

/**
 * @desc    Get all registered users (excluding the currently logged-in user)
 * @route   GET /api/users
 * @access  Private (Requires auth token)
 */
const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Retrieve all users from the User model where _id is not equal ($ne) to the current user's ID.
    // Exclude the password field using select('-password') for security.
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('-password');

    res.json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error.message);
    res.status(500).json({ message: 'Server error. Could not retrieve users.' });
  }
};

module.exports = {
  getAllUsers
};
