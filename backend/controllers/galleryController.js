const Gallery = require('../models/Gallery');

// Create a new gallery
const createGallery = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Gallery name is required' });
    }

    // Check if gallery with same name already exists for this user
    const existingGallery = await Gallery.findOne({
      name: name.trim(),
      user: req.user._id
    });

    if (existingGallery) {
      return res.status(400).json({ message: 'A gallery with this name already exists' });
    }

    const gallery = new Gallery({
      name: name.trim(),
      description: description || '',
      user: req.user._id
    });

    await gallery.save();

    res.status(201).json({
      message: 'Gallery created successfully',
      gallery: {
        id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        createdAt: gallery.createdAt
      }
    });
  } catch (error) {
    console.error('Create gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all galleries for the user
const getGalleries = async (req, res) => {
  try {
    const { search, isPublic, ownedOnly } = req.query;
    
    // Get user's own galleries
    const ownQuery = { user: req.user._id };
    if (search) {
      ownQuery.$text = { $search: search };
    }
    if (isPublic !== undefined) {
      ownQuery.isPublic = isPublic === 'true';
    }

    const ownGalleries = await Gallery.find(ownQuery)
      .sort({ createdAt: -1 })
      .exec();

    // If ownedOnly is requested, return only user's own galleries
    if (ownedOnly === 'true') {
      return res.json({ 
        galleries: ownGalleries
      });
    }

    // Get shared galleries
    const SharedGallery = require('../models/SharedGallery');
    const sharedGalleries = await SharedGallery.find({ sharedWith: req.user._id })
      .populate({
        path: 'gallery',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('sharedBy', 'name email')
      .sort({ sharedAt: -1 })
      .exec();

    // Filter out null galleries (in case they were deleted)
    const validSharedGalleries = sharedGalleries
      .filter(sg => sg.gallery)
      .map(sg => ({
        ...sg.gallery.toObject(),
        isShared: true,
        sharedBy: sg.sharedBy,
        sharedAt: sg.sharedAt
      }));

    res.json({ 
      galleries: [...ownGalleries, ...validSharedGalleries],
      sharedGalleries: validSharedGalleries
    });
  } catch (error) {
    console.error('Get galleries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single gallery
const getGalleryById = async (req, res) => {
  try {
    let gallery = await Gallery.findById(req.params.id)
      .populate('user', 'name email');

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check if this is a shared gallery
    const SharedGallery = require('../models/SharedGallery');
    const sharedGallery = await SharedGallery.findOne({
      gallery: req.params.id,
      sharedWith: req.user._id
    }).populate('sharedBy', 'name email');

    // Check access permissions
    const isOwner = gallery.user && gallery.user._id.toString() === req.user._id.toString();
    const isShared = sharedGallery !== null;
    const isPublic = gallery.isPublic;
    const isAdmin = req.user.role === 'admin';

    if (!isPublic && !isOwner && !isShared && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch media/images associated with this gallery
    const Media = require('../models/Media');
    const media = await Media.find({ gallery: req.params.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('title description tags filename fileUrl fileSize mimeType dimensions views downloads createdAt');

    // Add shared information if this is a shared gallery
    if (isShared) {
      gallery = gallery.toObject();
      gallery.isShared = true;
      gallery.sharedBy = sharedGallery.sharedBy;
      gallery.sharedAt = sharedGallery.sharedAt;
    }

    res.json({ 
      gallery,
      media: media,
      mediaCount: media.length
    });
  } catch (error) {
    console.error('Get gallery by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update gallery
const updateGallery = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check ownership
    if (gallery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (name !== undefined) gallery.name = name.trim();
    if (description !== undefined) gallery.description = description;
    if (isPublic !== undefined) gallery.isPublic = Boolean(isPublic);

    await gallery.save();

    res.json({
      message: 'Gallery updated successfully',
      gallery: {
        id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        isPublic: gallery.isPublic,
        updatedAt: gallery.updatedAt
      }
    });
  } catch (error) {
    console.error('Update gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete gallery
const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const isOwner = gallery.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    // Check if user has access to this gallery (owner, admin, or shared user)
    const SharedGallery = require('../models/SharedGallery');
    const sharedGallery = await SharedGallery.findOne({
      gallery: req.params.id,
      sharedWith: req.user._id
    });
    
    const isSharedUser = sharedGallery !== null;
    
    if (!isOwner && !isAdmin && !isSharedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (isOwner || isAdmin) {
      // Owner or admin deletion: Delete the entire gallery and all sharing relationships
      
      // First, delete all media associated with this gallery
      const Media = require('../models/Media');
      await Media.deleteMany({ gallery: req.params.id });
      
      // Delete all sharing relationships for this gallery
      await SharedGallery.deleteMany({ gallery: req.params.id });
      
      // Finally, delete the gallery itself
      await gallery.deleteOne();
      
      res.json({ message: 'Gallery deleted successfully' });
    } else if (isSharedUser) {
      // Shared user deletion: Only remove the sharing relationship for this user
      await SharedGallery.deleteOne({
        gallery: req.params.id,
        sharedWith: req.user._id
      });
      
      res.json({ message: 'Gallery removed from your shared galleries' });
    }
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Share gallery
const shareGallery = async (req, res) => {
  try {
    const { email } = req.body;
    const galleryId = req.params.id;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const gallery = await Gallery.findById(galleryId);
    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check ownership
    if (gallery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user with this email exists
    const User = require('../models/User');
    const recipient = await User.findOne({ email: email.trim() });
    
    if (!recipient) {
      return res.status(404).json({ message: 'User with this email not found. They need to register first.' });
    }

    // Create a shared gallery record or update existing one
    const SharedGallery = require('../models/SharedGallery');
    let sharedGallery = await SharedGallery.findOne({
      gallery: galleryId,
      sharedWith: recipient._id
    });

    if (!sharedGallery) {
      sharedGallery = new SharedGallery({
        gallery: galleryId,
        sharedBy: req.user._id,
        sharedWith: recipient._id,
        sharedAt: new Date()
      });
      await sharedGallery.save();
    }

    // TODO: Send email notification here
    // For now, we'll just return success
    // In a real implementation, you would send an email with a link to view the gallery

    res.json({ 
      message: 'Gallery shared successfully',
      sharedWith: recipient.email
    });
  } catch (error) {
    console.error('Share gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
  shareGallery
}; 