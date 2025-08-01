const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  reactivateUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserStats
} = require('../controllers/userController');

// User routes (authenticated)
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/stats', verifyToken, getUserStats);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllUsers);
router.get('/admin/:id', verifyToken, isAdmin, getUserById);
router.put('/admin/:id', verifyToken, isAdmin, updateUser);
router.delete('/admin/:id', verifyToken, isAdmin, deleteUser);
router.put('/admin/:id/reactivate', verifyToken, isAdmin, reactivateUser);
router.get('/admin/:userId/stats', verifyToken, isAdmin, getUserStats);

module.exports = router; 