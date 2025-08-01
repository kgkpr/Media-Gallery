const mongoose = require('mongoose');

const sharedGallerySchema = new mongoose.Schema({
  gallery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery',
    required: true
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique sharing relationship
sharedGallerySchema.index({ gallery: 1, sharedWith: 1 }, { unique: true });

module.exports = mongoose.model('SharedGallery', sharedGallerySchema); 