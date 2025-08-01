const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  register,
  verifyEmail,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getCurrentUser
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', verifyToken, getCurrentUser);

module.exports = router; 