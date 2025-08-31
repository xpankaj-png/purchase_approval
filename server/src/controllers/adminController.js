const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { logAuditEvent } = require('../services/auditService');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, department, role, active_only = true } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id, u.email, u.name, u.role, u.department, u.is_active, u.last_login, u.created_at,
        m.name as manager_name
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (active_only === 'true') {
      query += ` AND u.is_active = true`;
    }

    if (department) {
      query += ` AND u.department = $${++paramCount}`;
      params.push(department);
    }

    if (role) {
      query += ` AND u.role = $${++paramCount}`;
      params.push(role);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (active_only === 'true') {
      countQuery += ' AND u.is_active = true';
    }

    if (department) {
      countQuery += ` AND u.department = $${++countParamCount}`;
      countParams.push(department);
    }

    if (role) {
      countQuery += ` AND u.role = $${++countParamCount}`;
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, manager_id, is_active } = req.body;

    // Get current user data for audit
    const currentResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentResult.rows[0];

    const result = await pool.query(`
      UPDATE users SET 
        name = $1, 
        role = $2, 
        department = $3, 
        manager_id = $4, 
        is_active = $5, 
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, email, name, role, department, manager_id, is_active
    `, [name, role, department, manager_id, is_active, id]);

    // Log audit event
    await logAuditEvent(
      req.user.id, 
      'UPDATE_USER', 
      'user', 
      id, 
      currentUser, 
      result.rows[0], 
      req.ip, 
      req.get('User-Agent')
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      resource_type, 
      start_date, 
      end_date 
    } = req.query;

    const result = await require('../services/auditService').getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      userId: user_id,
      action,
      resourceType: resource_type,
      startDate: start_date,
      endDate: end_date
    });

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    // In a real application, this would come from a settings table
    const settings = {
      approvalLimits: {
        level1: 5000,
        level2: 25000,
        level3: 100000
      },
      deadlines: {
        level1: 24,
        level2: 48,
        level3: 72
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      },
      workflow: {
        autoEscalation: true,
        requireComments: true,
        allowBulkApproval: true
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;

    // In a real application, this would update a settings table
    // For now, we'll just log the audit event
    await logAuditEvent(
      req.user.id,
      'UPDATE_SYSTEM_SETTINGS',
      'system',
      'settings',
      null,
      settings,
      req.ip,
      req.get('User-Agent')
    );

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  updateUser,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings
};