require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createTestUsers = async () => {
  try {
    await connectDB();

    const testUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user',
        status: 'pending'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user',
        status: 'approved'
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        status: 'rejected'
      }
    ];

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`Test user created: ${userData.email}`);
      } else {
        console.log(`Test user already exists: ${userData.email}`);
      }
    }

    console.log('Test users seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();
