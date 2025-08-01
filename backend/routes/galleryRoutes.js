const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
  shareGallery
} = require('../controllers/galleryController');

// Protected routes
router.post('/', verifyToken, createGallery);
router.get('/', verifyToken, getGalleries);
router.get('/:id', verifyToken, getGalleryById);
router.put('/:id', verifyToken, updateGallery);
router.delete('/:id', verifyToken, deleteGallery);
router.post('/:id/share', verifyToken, shareGallery);

module.exports = router; 