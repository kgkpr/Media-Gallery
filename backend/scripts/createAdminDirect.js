const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB using the same connection string as your app
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/media-gallery';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema directly (in case model import fails)
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      isActive: { type: Boolean, default: true },
      isEmailVerified: { type: Boolean, default: false }
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Admin credentials
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.isEmailVerified = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Updated existing user to admin role');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Create new admin user
      const adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Created new admin user');
    }

    console.log('');
    console.log('🎉 Admin user is ready!');
    console.log('Login credentials:');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin');
    console.log('');
    console.log('You can now login and access the admin dashboard!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

createAdminUser();
