const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const result = await pool.query(
      'SELECT id, email, name, role, department, manager_id, avatar, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireOwnershipOrRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const requestId = req.params.id;
      
      // Check if user has required role
      if (roles.includes(req.user.role)) {
        return next();
      }

      // Check if user owns the request
      const result = await pool.query(
        'SELECT requester_id FROM purchase_requests WHERE id = $1',
        [requestId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (result.rows[0].requester_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrRole
};