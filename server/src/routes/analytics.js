const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Analytics routes
router.get('/dashboard', authenticateToken, requireRole(['Manager', 'Executive']), analyticsController.getDashboardMetrics);
router.get('/reports', authenticateToken, requireRole(['Manager', 'Executive']), analyticsController.getReports);
router.get('/budget-utilization', authenticateToken, requireRole(['Manager', 'Executive']), analyticsController.getBudgetUtilization);

module.exports = router;