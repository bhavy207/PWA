const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const sampleUsers = [
  {
    name: "Demo User",
    email: "user@demo.com",
    password: "demo123",
    role: "customer"
  },
  {
    name: "Demo Admin", 
    email: "admin@demo.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "John Doe",
    email: "john@example.com", 
    password: "password123",
    role: "customer"
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa-ecommerce');
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert users (password hashing is handled by User model pre-save hook)
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.email}`);
    }

    console.log('Sample users created successfully!');
    console.log('\nDemo Accounts:');
    console.log('User: user@demo.com / demo123');
    console.log('Admin: admin@demo.com / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
