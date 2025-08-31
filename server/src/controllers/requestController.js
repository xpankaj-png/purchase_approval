const pool = require('../config/database');
const { logAuditEvent } = require('../services/auditService');
const { sendNotification } = require('../services/notificationService');
const workflowService = require('../services/workflowService');

const getRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, urgency, department } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT pr.*, 
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'level', as_step.level,
                   'approver_id', as_step.approver_id,
                   'approver_name', as_step.approver_name,
                   'action', as_step.action,
                   'comments', as_step.comments,
                   'timestamp', as_step.created_at,
                   'deadline', as_step.deadline
                 ) ORDER BY as_step.level
               ) FILTER (WHERE as_step.id IS NOT NULL), 
               '[]'
             ) as approval_history
      FROM purchase_requests pr
      LEFT JOIN approval_steps as_step ON pr.id = as_step.request_id
    `;

    const conditions = [];
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (userRole === 'Employee') {
      conditions.push(`pr.requester_id = $${++paramCount}`);
      params.push(userId);
    } else if (userRole === 'Manager') {
      conditions.push(`(pr.requester_id = $${++paramCount} OR pr.department = $${++paramCount})`);
      params.push(userId, req.user.department);
    }
    // Executives can see all requests

    // Additional filters
    if (status) {
      conditions.push(`pr.status = $${++paramCount}`);
      params.push(status);
    }

    if (category) {
      conditions.push(`pr.category = $${++paramCount}`);
      params.push(category);
    }

    if (urgency) {
      conditions.push(`pr.urgency = $${++paramCount}`);
      params.push(urgency);
    }

    if (department) {
      conditions.push(`pr.department = $${++paramCount}`);
      params.push(department);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY pr.id
      ORDER BY pr.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM purchase_requests pr';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      requests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT pr.*, 
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'level', as_step.level,
                   'approver_id', as_step.approver_id,
                   'approver_name', as_step.approver_name,
                   'action', as_step.action,
                   'comments', as_step.comments,
                   'timestamp', as_step.created_at,
                   'deadline', as_step.deadline
                 ) ORDER BY as_step.level
               ) FILTER (WHERE as_step.id IS NOT NULL), 
               '[]'
             ) as approval_history
      FROM purchase_requests pr
      LEFT JOIN approval_steps as_step ON pr.id = as_step.request_id
      WHERE pr.id = $1
      GROUP BY pr.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Check access permissions
    if (req.user.role === 'Employee' && request.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'Manager' && 
        request.requester_id !== req.user.id && 
        request.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(request);

  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      category,
      description,
      vendor,
      vendor_contact,
      amount,
      urgency = 'Normal',
      budget_code,
      justification,
      expected_delivery,
      attachments = []
    } = req.body;

    const userId = req.user.id;
    const userName = req.user.name;
    const userDepartment = req.user.department;

    // Calculate deadline based on amount
    const requiredLevel = workflowService.getRequiredApprovalLevel(amount);
    const deadlineHours = workflowService.getDeadlineHours(1); // First level deadline
    const deadlineDate = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

    // Get next approver
    const nextApprover = await workflowService.getNextApprover(userId, userDepartment, 1, amount);

    const result = await client.query(`
      INSERT INTO purchase_requests (
        requester_id, requester_name, department, category, description, vendor,
        vendor_contact, amount, urgency, budget_code, justification, expected_delivery,
        attachments, status, current_approver_id, deadline_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      userId, userName, userDepartment, category, description, vendor,
      vendor_contact, amount, urgency, budget_code, justification, expected_delivery,
      attachments, 'Pending_L1', nextApprover?.id, deadlineDate
    ]);

    const newRequest = result.rows[0];

    // Log audit event
    await logAuditEvent(userId, 'CREATE_REQUEST', 'purchase_request', newRequest.id, null, newRequest, req.ip, req.get('User-Agent'));

    // Send notification to approver
    if (nextApprover) {
      await sendNotification(nextApprover.id, {
        title: 'New Purchase Request',
        message: `${userName} submitted a purchase request for ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        type: 'info',
        request_id: newRequest.id
      });
    }

    // Send confirmation notification to requester
    await sendNotification(userId, {
      title: 'Request Submitted',
      message: `Your purchase request for ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} has been submitted for approval`,
      type: 'success',
      request_id: newRequest.id
    });

    await client.query('COMMIT');

    res.status(201).json({
      ...newRequest,
      approval_history: []
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

const updateRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      category,
      description,
      vendor,
      vendor_contact,
      amount,
      urgency,
      budget_code,
      justification,
      expected_delivery,
      attachments
    } = req.body;

    // Check if request exists and user has permission
    const existingResult = await client.query(
      'SELECT * FROM purchase_requests WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const existingRequest = existingResult.rows[0];

    // Only allow updates if request is in draft or user is the requester
    if (existingRequest.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['Draft', 'Pending_L1'].includes(existingRequest.status)) {
      return res.status(400).json({ error: 'Request cannot be modified in current status' });
    }

    const result = await client.query(`
      UPDATE purchase_requests SET
        category = $1, description = $2, vendor = $3, vendor_contact = $4,
        amount = $5, urgency = $6, budget_code = $7, justification = $8,
        expected_delivery = $9, attachments = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      category, description, vendor, vendor_contact, amount, urgency,
      budget_code, justification, expected_delivery, attachments, id
    ]);

    // Log audit event
    await logAuditEvent(req.user.id, 'UPDATE_REQUEST', 'purchase_request', id, existingRequest, result.rows[0], req.ip, req.get('User-Agent'));

    await client.query('COMMIT');

    res.json({
      ...result.rows[0],
      approval_history: []
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

const deleteRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if request exists and user has permission
    const result = await client.query(
      'SELECT * FROM purchase_requests WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = result.rows[0];

    // Only allow deletion if user is the requester and request is in draft
    if (request.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (request.status !== 'Draft') {
      return res.status(400).json({ error: 'Only draft requests can be deleted' });
    }

    await client.query('DELETE FROM purchase_requests WHERE id = $1', [id]);

    // Log audit event
    await logAuditEvent(req.user.id, 'DELETE_REQUEST', 'purchase_request', id, request, null, req.ip, req.get('User-Agent'));

    await client.query('COMMIT');

    res.json({ message: 'Request deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest
};