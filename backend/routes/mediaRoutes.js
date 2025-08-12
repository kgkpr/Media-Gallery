const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middlewares/auth');
const {
  uploadMedia,
  getMedia,
  getMediaById,
  getMediaByGallery,
  updateMedia,
  deleteMedia,
  downloadMedia,
  downloadMediaAsZip,
  getMediaStats
} = require('../controllers/mediaController');

// Media listing is now protected (requires auth)
router.get('/', verifyToken, getMedia);

// Protected routes
router.get('/stats', verifyToken, getMediaStats);
router.get('/gallery/:galleryId', verifyToken, getMediaByGallery);
router.post('/upload', verifyToken, uploadMedia);
router.post('/download-zip', verifyToken, downloadMediaAsZip);
router.get('/:id', optionalAuth, getMediaById);
router.put('/:id', verifyToken, updateMedia);
router.delete('/:id', verifyToken, deleteMedia);
router.get('/:id/download', verifyToken, downloadMedia);

module.exports = router; 