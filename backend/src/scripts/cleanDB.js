const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../../.env' });

const User = require('../models/User');
const Message = require('../models/Message');

const cleanDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Clearing all messages...');
    await Message.deleteMany({});

    console.log('Clearing all users...');
    await User.deleteMany({});

    console.log('\n========================================');
    console.log(' ✅ DATABASE CLEARED SUCCESSFULLY!     ');
    console.log('========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
};

cleanDatabase();
