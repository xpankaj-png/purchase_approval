const express = require('express');
const { authenticateToken, requireOwnershipOrRole } = require('../middleware/auth');
const { validateCreateRequest, validateUUID, validatePagination } = require('../middleware/validation');
const requestController = require('../controllers/requestController');

const router = express.Router();

// Purchase request routes
router.get('/', authenticateToken, validatePagination, requestController.getRequests);
router.post('/', authenticateToken, validateCreateRequest, requestController.createRequest);
router.get('/:id', authenticateToken, validateUUID, requireOwnershipOrRole(['Manager', 'Executive']), requestController.getRequestById);
router.put('/:id', authenticateToken, validateUUID, requireOwnershipOrRole(), requestController.updateRequest);
router.delete('/:id', authenticateToken, validateUUID, requireOwnershipOrRole(), requestController.deleteRequest);

module.exports = router;