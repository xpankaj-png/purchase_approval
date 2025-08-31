const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateCreateRequest = [
  body('category')
    .isIn(['IT Equipment', 'Office Supplies', 'Software', 'Services', 'Travel', 'Other'])
    .withMessage('Invalid category'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('vendor')
    .isLength({ min: 2, max: 255 })
    .withMessage('Vendor name must be between 2 and 255 characters'),
  body('vendor_contact')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid vendor email is required'),
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between 0.01 and 1,000,000'),
  body('urgency')
    .isIn(['Normal', 'High', 'Critical'])
    .withMessage('Invalid urgency level'),
  body('budget_code')
    .isLength({ min: 1, max: 50 })
    .withMessage('Budget code is required'),
  body('justification')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Justification must be between 20 and 2000 characters'),
  body('expected_delivery')
    .isISO8601()
    .toDate()
    .withMessage('Valid delivery date is required'),
  handleValidationErrors
];

const validateApprovalAction = [
  body('action')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Action must be Approved or Rejected'),
  body('comments')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comments must not exceed 1000 characters'),
  handleValidationErrors
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateCreateRequest,
  validateApprovalAction,
  validateUUID,
  validatePagination,
  handleValidationErrors
};