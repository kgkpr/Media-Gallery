const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin user details
    const adminData = {
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'admin',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists with email:', adminData.email);
      console.log('You can login with:');
      console.log('Email:', adminData.email);
      console.log('Password: admin');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('');
    console.log('You can now login at: http://localhost:3000/login');
    console.log('After login, access admin dashboard at: http://localhost:3000/admin');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
