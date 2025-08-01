const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middlewares/auth');
const {
  uploadMedia,
  getMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
  downloadMedia,
  downloadMediaAsZip,
  getMediaStats
} = require('../controllers/mediaController');

// Public routes (with optional auth)
router.get('/', optionalAuth, getMedia);

// Protected routes
router.get('/stats', verifyToken, getMediaStats);
router.post('/upload', verifyToken, uploadMedia);
router.post('/download-zip', verifyToken, downloadMediaAsZip);
router.get('/:id', optionalAuth, getMediaById);
router.put('/:id', verifyToken, updateMedia);
router.delete('/:id', verifyToken, deleteMedia);
router.get('/:id/download', verifyToken, downloadMedia);

module.exports = router; 