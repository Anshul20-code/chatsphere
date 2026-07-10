const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definition of the User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      // Simple regex format check for valid email
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    }
  },
  {
    // Automatically creates createdAt and updatedAt fields for each record
    timestamps: true
  }
);

// Mongoose Pre-save middleware: runs before saving a user document to the database
// We use a regular function here instead of an arrow function to preserve the context of "this"
userSchema.pre('save', async function () {
  // If the password hasn't been modified, skip hashing it again (e.g. on profile updates)
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt (rounds of complexity = 10)
  const salt = await bcrypt.genSalt(10);
  // Hash password with the generated salt
  this.password = await bcrypt.hash(this.password, salt);
});

// Custom instance method on the User schema to check if password is correct
// This can be called on any retrieved user document, like: user.matchPassword(enteredPassword)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model for use in other parts of the application
module.exports = mongoose.model('User', userSchema);
