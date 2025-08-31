const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Admin routes (Executive only)
router.get('/users', authenticateToken, requireRole(['Executive']), adminController.getUsers);
router.put('/users/:id', authenticateToken, requireRole(['Executive']), adminController.updateUser);
router.get('/audit-logs', authenticateToken, requireRole(['Executive']), adminController.getAuditLogs);
router.get('/system-settings', authenticateToken, requireRole(['Executive']), adminController.getSystemSettings);
router.put('/system-settings', authenticateToken, requireRole(['Executive']), adminController.updateSystemSettings);

module.exports = router;