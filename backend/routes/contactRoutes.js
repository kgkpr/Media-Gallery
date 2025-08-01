const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  submitMessage,
  getMyMessages,
  updateMyMessage,
  deleteMyMessage,
  getAllMessages,
  deleteAnyMessage,
  updateMessageStatus
} = require('../controllers/contactController');

// Public routes
router.post('/', submitMessage);

// User routes (authenticated)
router.get('/my-messages', verifyToken, getMyMessages);
router.put('/:id', verifyToken, updateMyMessage);
router.delete('/:id', verifyToken, deleteMyMessage);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllMessages);
router.delete('/admin/:id', verifyToken, isAdmin, deleteAnyMessage);
router.put('/admin/:id/status', verifyToken, isAdmin, updateMessageStatus);

module.exports = router; 