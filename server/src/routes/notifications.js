const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateUUID, validatePagination } = require('../middleware/validation');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Notification routes
router.get('/', authenticateToken, validatePagination, notificationController.getNotifications);
router.put('/:id/read', authenticateToken, validateUUID, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);
router.delete('/:id', authenticateToken, validateUUID, notificationController.deleteNotification);

module.exports = router;