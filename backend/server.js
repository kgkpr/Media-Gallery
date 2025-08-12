const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({path: './.env'});

const app = express();

// Import routes
const authRoutes = require('./routes/authRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const contactRoutes = require('./routes/contactRoutes');
const userRoutes = require('./routes/userRoutes');
const galleryRoutes = require('./routes/galleryRoutes');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // <- disable COEP
  crossOriginOpenerPolicy: false,   // <- disable COOP
}));

// Rate limiting (dev values)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Additional headers for Google OAuth compatibility
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/setup', require('./routes/setupRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Media Gallery API is running',
    timestamp: new Date().toISOString()
  });
});

// Test image serving endpoint
app.get('/api/test-images', (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    
    res.json({
      message: 'Image files found',
      count: imageFiles.length,
      files: imageFiles.map(file => ({
        filename: file,
        url: `/uploads/${file}`
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error reading uploads directory',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB with fallback (Atlas -> Local)
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  });
};

const connectToMongo = async () => {
  console.log('Attempting to connect to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

  const commonOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Try primary (Atlas) first
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, commonOptions);
      console.log('✅ Connected to MongoDB Atlas successfully');
      startServer();
      return;
    } catch (err) {
      console.error('❌ MongoDB Atlas connection error:', err.message);
      console.error('Falling back to local MongoDB...');
    }
  }

  // Fallback to local MongoDB
  const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017/media-gallery';
  try {
    await mongoose.connect(localUri, commonOptions);
    console.log('✅ Connected to local MongoDB successfully');
    startServer();
  } catch (err) {
    console.error('❌ Local MongoDB connection error:', err.message);
    console.error('Please start a local MongoDB instance or fix your Atlas connection.');
    process.exit(1);
  }
};

connectToMongo();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;
