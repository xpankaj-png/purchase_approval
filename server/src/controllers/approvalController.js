const pool = require('../config/database');
const { logAuditEvent } = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const WorkflowService = require('../services/workflowService');

const getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

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
      WHERE pr.current_approver_id = $1 AND pr.status LIKE 'Pending_%'
      GROUP BY pr.id
      ORDER BY pr.deadline_date ASC, pr.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM purchase_requests WHERE current_approver_id = $1 AND status LIKE $2',
      [userId, 'Pending_%']
    );

    res.json({
      requests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const approveRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { comments = '' } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM purchase_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Verify user is the current approver
    if (request.current_approver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to approve this request' });
    }

    // Determine current level
    const currentLevel = request.status === 'Pending_L1' ? 1 : 
                        request.status === 'Pending_L2' ? 2 : 3;

    // Create approval step
    const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(`
      INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, currentLevel, userId, userName, 'Approved', comments, deadlineDate]);

    // Route to next level or complete
    const requiredLevel = WorkflowService.getRequiredApprovalLevel(request.amount);
    
    if (currentLevel >= requiredLevel) {
      // Request is fully approved
      await client.query(
        'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
        ['Approved', id]
      );

      // Notify requester
      await NotificationService.sendNotification(request.requester_id, {
        title: 'Request Approved',
        message: `Your purchase request for ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} has been fully approved`,
        type: 'success',
        request_id: id
      });
    } else {
      // Route to next level
      await WorkflowService.routeToNextLevel(id, currentLevel);
    }

    // Log audit event
    await logAuditEvent(userId, 'APPROVE_REQUEST', 'purchase_request', id, null, { level: currentLevel, comments }, req.ip, req.get('User-Agent'));

    await client.query('COMMIT');

    res.json({ message: 'Request approved successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

const rejectRequest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!comments || !comments.trim()) {
      return res.status(400).json({ error: 'Comments are required for rejection' });
    }

    // Get request details
    const requestResult = await client.query(
      'SELECT * FROM purchase_requests WHERE id = $1',
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    // Verify user is the current approver
    if (request.current_approver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    // Determine current level
    const currentLevel = request.status === 'Pending_L1' ? 1 : 
                        request.status === 'Pending_L2' ? 2 : 3;

    // Create rejection step
    const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await client.query(`
      INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, currentLevel, userId, userName, 'Rejected', comments, deadlineDate]);

    // Update request status
    await client.query(
      'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
      ['Rejected', id]
    );

    // Notify requester
    await NotificationService.sendNotification(request.requester_id, {
      title: 'Request Rejected',
      message: `Your purchase request for ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} has been rejected`,
      type: 'error',
      request_id: id
    });

    // Log audit event
    await logAuditEvent(userId, 'REJECT_REQUEST', 'purchase_request', id, null, { level: currentLevel, comments }, req.ip, req.get('User-Agent'));

    await client.query('COMMIT');

    res.json({ message: 'Request rejected successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

const bulkApproval = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { requestIds, action, comments = '' } = req.body;
    const userId = req.user.id;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ error: 'Request IDs are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    if (action === 'reject' && !comments.trim()) {
      return res.status(400).json({ error: 'Comments are required for rejection' });
    }

    const results = [];

    for (const requestId of requestIds) {
      try {
        // Get request details
        const requestResult = await client.query(
          'SELECT * FROM purchase_requests WHERE id = $1 AND current_approver_id = $2',
          [requestId, userId]
        );

        if (requestResult.rows.length === 0) {
          results.push({ requestId, success: false, error: 'Request not found or not authorized' });
          continue;
        }

        const request = requestResult.rows[0];
        const currentLevel = request.status === 'Pending_L1' ? 1 : 
                            request.status === 'Pending_L2' ? 2 : 3;

        if (action === 'approve') {
          // Create approval step
          const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await client.query(`
            INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [requestId, currentLevel, userId, req.user.name, 'Approved', comments, deadlineDate]);

          // Route to next level or complete
          const requiredLevel = WorkflowService.getRequiredApprovalLevel(request.amount);
          
          if (currentLevel >= requiredLevel) {
            await client.query(
              'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
              ['Approved', requestId]
            );
          } else {
            await WorkflowService.routeToNextLevel(requestId, currentLevel);
          }

          results.push({ requestId, success: true, action: 'approved' });
        } else {
          // Reject request
          const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await client.query(`
            INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [requestId, currentLevel, userId, req.user.name, 'Rejected', comments, deadlineDate]);

          await client.query(
            'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
            ['Rejected', requestId]
          );

          results.push({ requestId, success: true, action: 'rejected' });
        }

        // Log audit event
        await logAuditEvent(userId, action.toUpperCase() + '_REQUEST', 'purchase_request', requestId, null, { level: currentLevel, comments, bulk: true }, req.ip, req.get('User-Agent'));

      } catch (error) {
        console.error(`Error processing request ${requestId}:`, error);
        results.push({ requestId, success: false, error: error.message });
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Bulk operation completed',
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getPendingApprovals,
  approveRequest,
  rejectRequest,
  bulkApproval
};