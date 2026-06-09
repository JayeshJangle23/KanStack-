const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/google', controller.googleAuth);
router.get('/me', protect, controller.getMe);
router.get('/stats', protect, controller.getStats);
router.get('/users/search', protect, controller.searchUsers);

module.exports = router;
