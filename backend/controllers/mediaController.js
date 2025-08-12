const Media = require('../models/Media');
const Gallery = require('../models/Gallery');
const SharedGallery = require('../models/SharedGallery');
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

      const { title, description, tags, isPublic, gallery } = req.body;

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
        isPublic: isPublic === 'true',
        user: req.user._id,
        gallery: gallery || null
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
      isPublic,
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

    // User filter
    if (userId) {
      query.user = userId;
    } else if (req.user && req.user.role !== 'admin') {
      // Non-admin users can only see their own media
      query.user = req.user._id;
    } else if (!req.user) {
      // Unauthenticated users can only see public media
      query.isPublic = true;
    }

    // Public filter
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const media = await Media.find(query)
      .populate('user', 'name email')
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

// Get media by gallery
const getMediaByGallery = async (req, res) => {
  try {
    const { galleryId } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc', search, tags } = req.query;

    // Verify gallery exists and user has access
    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check access permissions
    const isOwner = gallery.user.toString() === req.user._id.toString();
    const isPublic = gallery.isPublic;
    const isAdmin = req.user.role === 'admin';

    // Check if this is a shared gallery
    const sharedGallery = await SharedGallery.findOne({
      gallery: galleryId,
      sharedWith: req.user._id
    });
    const isShared = sharedGallery !== null;

    if (!isPublic && !isOwner && !isShared && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query for media in this gallery
    const query = { gallery: galleryId };

    // Search filter
    if (search) {
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

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get media for this specific gallery with filters
    const media = await Media.find(query)
      .populate('user', 'name email')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Media.countDocuments(query);

    res.json({
      media,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get media by gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get media statistics
const getMediaStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user._id;

    const stats = await Media.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalMedia: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalViews: { $sum: '$views' },
          totalDownloads: { $sum: '$downloads' }
        }
      }
    ]);

    // Compute gallery-related stats
    const [totalGalleries, totalSharedGalleries] = await Promise.all([
      Gallery.countDocuments({ user: userId }),
      SharedGallery.countDocuments({ sharedWith: userId })
    ]);

    const recentMedia = await Media.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title fileUrl createdAt');

    const baseStats = stats[0] || {
      totalMedia: 0,
      totalSize: 0,
      totalViews: 0,
      totalDownloads: 0
    };

    // Attach gallery counts expected by the frontend dashboard
    const responseStats = {
      ...baseStats,
      totalGalleries,
      totalSharedGalleries
    };

    res.json({
      stats: responseStats,
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
  getMediaByGallery,
  updateMedia,
  deleteMedia,
  downloadMedia,
  downloadMediaAsZip,
  getMediaStats
}; 