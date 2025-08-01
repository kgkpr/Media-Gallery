const Media = require('../models/Media');
const { upload, validateFile, getImageDimensions, cleanupUploads } = require('../utils/upload');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Upload media
const uploadMedia = async (req, res) => {
  try {
    upload.single('media')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const errors = validateFile(req.file);
      if (errors.length > 0) {
        cleanupUploads(req.file.path);
        return res.status(400).json({ message: errors.join(', ') });
      }

      const { title, description, tags, galleryId } = req.body;

      // Check if user can upload to this gallery (only owners can upload)
      if (galleryId) {
        const Gallery = require('../models/Gallery');
        const gallery = await Gallery.findOne({ _id: galleryId, user: req.user._id });
        if (!gallery) {
          cleanupUploads(req.file.path);
          return res.status(403).json({ message: 'You can only upload to your own galleries' });
        }
      }

      // Get image dimensions
      let dimensions = {};
      try {
        dimensions = await getImageDimensions(req.file.path);
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }

      // Create media record
      const media = new Media({
        title: title || req.file.originalname,
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        dimensions,

        user: req.user._id,
        gallery: galleryId || null
      });

      await media.save();

      res.status(201).json({
        message: 'Media uploaded successfully',
        media: {
          id: media._id,
          title: media.title,
          description: media.description,
          tags: media.tags,
          fileUrl: media.fileUrl,
          fileSize: media.formattedSize,
          dimensions: media.dimensions,
          isPublic: media.isPublic,
          gallery: media.gallery,
          createdAt: media.createdAt
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all media (with filters)
const getMedia = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      tags, 
      userId,
      galleryId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      // Use text search if available, otherwise use regex
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Gallery filter
    if (galleryId) {
      query.gallery = galleryId;
    }

    // User filter
    if (userId) {
      query.user = userId;
    } else if (req.user && req.user.role !== 'admin') {
      // If viewing a specific gallery, check if user has access to it (own or shared)
      if (galleryId) {
        const SharedGallery = require('../models/SharedGallery');
        const Gallery = require('../models/Gallery');
        
        // Check if it's user's own gallery or a shared gallery
        const ownGallery = await Gallery.findOne({ _id: galleryId, user: req.user._id });
        const sharedGallery = await SharedGallery.findOne({ gallery: galleryId, sharedWith: req.user._id });
        
        if (!ownGallery && !sharedGallery) {
          // User doesn't have access to this gallery
          query._id = null; // This will return no results
        }
        // If user has access, the galleryId filter will handle the rest
      } else {
        // For "My Images" view (no galleryId), show only user's own media
        query.user = req.user._id;
      }
    } else if (!req.user) {
      // Unauthenticated users cannot see any media
      query._id = null; // This will return no results
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const media = await Media.find(query)
      .populate('user', 'name email')
      .populate('gallery', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Media.countDocuments(query);

    res.json({
      media,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single media
const getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('user', 'name email');

    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check access permissions - only if user is authenticated
    if (req.user) {
      if (!media.isPublic && media.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Increment views only for authenticated users
      media.views += 1;
      await media.save();
    } else {
      // For unauthenticated users, only show public media
      if (!media.isPublic) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ media });
  } catch (error) {
    console.error('Get media by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update media
const updateMedia = async (req, res) => {
  try {
    const { title, description, tags, isPublic } = req.body;
    console.log('Update request body:', req.body);

    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check ownership
    if (media.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    
    // Handle tags - if it's an array, use it directly; if it's a string, split it
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        media.tags = tags;
      } else if (typeof tags === 'string') {
        media.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else {
        media.tags = [];
      }
    }
    
    // Handle isPublic - convert to boolean
    if (isPublic !== undefined) {
      media.isPublic = Boolean(isPublic);
    }

    await media.save();
    console.log('Updated media:', media);

    res.json({
      message: 'Media updated successfully',
      media: {
        id: media._id,
        title: media.title,
        description: media.description,
        tags: media.tags,
        isPublic: media.isPublic,
        updatedAt: media.updatedAt
      }
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check ownership
    if (media.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from storage
    const filePath = path.join(__dirname, '..', 'uploads', media.filename);
    cleanupUploads(filePath);

    await Media.findByIdAndDelete(req.params.id);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download single media file
const downloadMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Check access permissions
    if (!media.isPublic && media.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', media.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Increment download count
    media.downloads += 1;
    await media.save();

    res.download(filePath, media.originalName);
  } catch (error) {
    console.error('Download media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download media as ZIP
const downloadMediaAsZip = async (req, res) => {
  try {
    const { mediaIds } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ message: 'Please select media to download' });
    }

    const media = await Media.find({
      _id: { $in: mediaIds },
      $or: [
        { user: req.user._id },
        { isPublic: true }
      ]
    });

    if (media.length === 0) {
      return res.status(404).json({ message: 'No media found' });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('media-gallery.zip');
    archive.pipe(res);

    for (const item of media) {
      const filePath = path.join(__dirname, '..', 'uploads', item.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: item.originalName });
        
        // Increment download count
        item.downloads += 1;
        await item.save();
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('Download ZIP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get media statistics
const getMediaStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user._id;
    const Gallery = require('../models/Gallery');
    const SharedGallery = require('../models/SharedGallery');

    // Get media stats
    const mediaStats = await Media.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalMedia: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]);

    // Get gallery counts
    const totalGalleries = await Gallery.countDocuments({ user: userId });
    
    // Get shared galleries count (galleries received by this user from others)
    const totalSharedGalleries = await SharedGallery.countDocuments({ sharedWith: userId });

    const recentMedia = await Media.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title fileUrl createdAt views downloads');

    res.json({
      stats: {
        totalMedia: mediaStats[0]?.totalMedia || 0,
        totalSize: mediaStats[0]?.totalSize || 0,
        totalGalleries,
        totalSharedGalleries
      },
      recentMedia
    });
  } catch (error) {
    console.error('Get media stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  downloadMedia,
  downloadMediaAsZip,
  getMediaStats
}; 