const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  coverImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for search functionality
gallerySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Gallery', gallerySchema); 