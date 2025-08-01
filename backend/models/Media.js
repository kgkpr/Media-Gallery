const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  dimensions: {
    width: Number,
    height: Number
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gallery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery'
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
mediaSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for formatted file size
mediaSchema.virtual('formattedSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtual fields are serialized
mediaSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Media', mediaSchema); 