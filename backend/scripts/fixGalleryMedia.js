const mongoose = require('mongoose');
const Media = require('../models/Media');
const Gallery = require('../models/Gallery');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/media-gallery', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixGalleryMedia() {
  try {
    console.log('Checking media items...');
    
    // Find all media items
    const allMedia = await Media.find({});
    console.log(`Total media items: ${allMedia.length}`);
    
    // Find media items without gallery field or with null gallery
    const mediaWithoutGallery = await Media.find({
      $or: [
        { gallery: { $exists: false } },
        { gallery: null }
      ]
    });
    
    console.log(`Media items without gallery: ${mediaWithoutGallery.length}`);
    
    if (mediaWithoutGallery.length > 0) {
      console.log('Sample media items without gallery:');
      mediaWithoutGallery.slice(0, 5).forEach(media => {
        console.log(`- ID: ${media._id}, Title: ${media.title}, User: ${media.user}`);
      });
    }
    
    // Find media items with gallery field
    const mediaWithGallery = await Media.find({
      gallery: { $exists: true, $ne: null }
    });
    
    console.log(`Media items with gallery: ${mediaWithGallery.length}`);
    
    if (mediaWithGallery.length > 0) {
      console.log('Sample media items with gallery:');
      mediaWithGallery.slice(0, 5).forEach(media => {
        console.log(`- ID: ${media._id}, Title: ${media.title}, Gallery: ${media.gallery}`);
      });
    }
    
    // Get all galleries
    const galleries = await Gallery.find({});
    console.log(`Total galleries: ${galleries.length}`);
    
    galleries.forEach(gallery => {
      console.log(`- Gallery: ${gallery.name} (${gallery._id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixGalleryMedia();
