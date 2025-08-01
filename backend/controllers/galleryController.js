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
      isPublic: isPublic || false,
      user: req.user._id
    });

    await gallery.save();

    res.status(201).json({
      message: 'Gallery created successfully',
      gallery: {
        id: gallery._id,
        name: gallery.name,
        description: gallery.description,
        isPublic: gallery.isPublic,
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
    const { search, isPublic } = req.query;
    const query = { user: req.user._id };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Public filter
    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const galleries = await Gallery.find(query)
      .sort({ createdAt: -1 })
      .exec();

    res.json({ galleries });
  } catch (error) {
    console.error('Get galleries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single gallery
const getGalleryById = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id)
      .populate('user', 'name email');

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    // Check access permissions
    if (!gallery.isPublic && gallery.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ gallery });
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

    // Check ownership
    if (gallery.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await gallery.remove();

    res.json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery
}; 