const Contact = require('../models/Contact');

// Submit contact message
const submitMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const contact = new Contact({
      name,
      email,
      message,
      userId: req.user ? req.user._id : null
    });

    await contact.save();

    res.status(201).json({
      message: 'Message submitted successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('Submit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's own messages
const getMyMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const messages = await Contact.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Contact.countDocuments({ userId: req.user._id });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get my messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user's own message
const updateMyMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check ownership
    if (contact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    contact.message = message;
    await contact.save();

    res.json({
      message: 'Message updated successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        updatedAt: contact.updatedAt
      }
    });
  } catch (error) {
    console.error('Update my message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user's own message
const deleteMyMessage = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check ownership
    if (contact.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete my message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Get all messages
const getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const messages = await Contact.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Contact.countDocuments(query);

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Delete any message
const deleteAnyMessage = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete any message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update message status
const updateMessageStatus = async (req, res) => {
  try {
    const { status, isResolved } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (status) {
      contact.status = status;
    }
    if (isResolved !== undefined) {
      contact.isResolved = isResolved;
    }

    await contact.save();

    res.json({
      message: 'Message status updated successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        status: contact.status,
        isResolved: contact.isResolved,
        updatedAt: contact.updatedAt
      }
    });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitMessage,
  getMyMessages,
  updateMyMessage,
  deleteMyMessage,
  getAllMessages,
  deleteAnyMessage,
  updateMessageStatus
}; 