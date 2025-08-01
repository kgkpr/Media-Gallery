const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Setup admin user - This is a one-time setup endpoint
router.post('/create-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      // Update existing user to admin
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      adminUser.isActive = true;
      await adminUser.save();
      
      return res.json({
        success: true,
        message: 'Admin user updated successfully',
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      });
    }

    // Create new admin user
    adminUser = new User({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    await adminUser.save();

    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

module.exports = router;
