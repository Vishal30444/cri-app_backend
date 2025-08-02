require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const clearDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing database...');
    
    // Delete all users
    await User.deleteMany({});
    
    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Are you sure you want to clear the database? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    clearDatabase();
  } else {
    console.log('Database clearing cancelled');
    process.exit(0);
  }
  rl.close();
});
