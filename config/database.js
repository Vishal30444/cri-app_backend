const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Temporary hardcoded URI for testing
    const uri = process.env.MONGODB_URI || 'your-actual-mongodb-uri-here';
    
    console.log('Attempting to connect to:', uri ? 'URI loaded' : 'URI not found');
    
    if (!uri || uri === 'your-actual-mongodb-uri-here') {
      throw new Error('MONGODB_URI is not properly configured');
    }
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
