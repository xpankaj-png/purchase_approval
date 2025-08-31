const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateApprovalAction, validateUUID } = require('../middleware/validation');
const approvalController = require('../controllers/approvalController');

const router = express.Router();

// Approval routes
router.get('/pending', authenticateToken, requireRole(['Manager', 'Executive']), approvalController.getPendingApprovals);
router.post('/:id/approve', authenticateToken, validateUUID, validateApprovalAction, requireRole(['Manager', 'Executive']), approvalController.approveRequest);
router.post('/:id/reject', authenticateToken, validateUUID, validateApprovalAction, requireRole(['Manager', 'Executive']), approvalController.rejectRequest);
router.post('/bulk', authenticateToken, requireRole(['Manager', 'Executive']), approvalController.bulkApproval);

module.exports = router;