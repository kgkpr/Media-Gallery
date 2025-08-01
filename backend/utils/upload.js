const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return cb(new Error('File size must be less than 5MB'), false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Get image dimensions
const getImageDimensions = (filePath) => {
  return new Promise((resolve, reject) => {
    const { createCanvas, loadImage } = require('canvas');
    
    loadImage(filePath)
      .then(img => {
        resolve({
          width: img.width,
          height: img.height
        });
      })
      .catch(err => {
        reject(err);
      });
  });
};

// Validate file before upload
const validateFile = (file) => {
  const errors = [];
  
  // Check if file exists
  if (!file) {
    errors.push('No file uploaded');
    return errors;
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPG, JPEG, and PNG files are allowed');
  }
  
  // Check file size
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  return errors;
};

// Clean up uploaded files
const cleanupUploads = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = {
  upload,
  validateFile,
  getImageDimensions,
  cleanupUploads
}; 