const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.get('/me', auth, authController.me);
router.post('/logout', auth, authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, authController.resetPassword);

module.exports = router;
