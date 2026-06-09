const express = require('express');
const router = express.Router();
const controller = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

router.get('/settings', protect, controller.getSettings);
router.put('/settings', protect, controller.updateSettings);
router.post('/test', protect, controller.sendTestEmail);
router.get('/preview', protect, controller.getPreview);
router.get('/logs', protect, controller.getEmailLogs);
router.post('/run', protect, controller.triggerMonitor);

module.exports = router;
