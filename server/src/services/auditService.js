const pool = require('../config/database');

const logAuditEvent = async (userId, action, resourceType, resourceId, oldValues, newValues, ipAddress, userAgent) => {
  try {
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

const getAuditLogs = async (options = {}) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      action, 
      resourceType, 
      startDate, 
      endDate 
    } = options;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (userId) {
      query += ` AND al.user_id = $${++paramCount}`;
      params.push(userId);
    }
    
    if (action) {
      query += ` AND al.action = $${++paramCount}`;
      params.push(action);
    }
    
    if (resourceType) {
      query += ` AND al.resource_type = $${++paramCount}`;
      params.push(resourceType);
    }
    
    if (startDate) {
      query += ` AND al.created_at >= $${++paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND al.created_at <= $${++paramCount}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY al.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_logs al WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    if (userId) countQuery += ' AND al.user_id = $1';
    if (action) countQuery += ` AND al.action = $${userId ? 2 : 1}`;
    if (resourceType) countQuery += ` AND al.resource_type = $${countParams.length + 1}`;
    if (startDate) countQuery += ` AND al.created_at >= $${countParams.length + 1}`;
    if (endDate) countQuery += ` AND al.created_at <= $${countParams.length + 1}`;
    
    const countResult = await pool.query(countQuery, countParams);
    
    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
};

module.exports = {
  logAuditEvent,
  getAuditLogs
};