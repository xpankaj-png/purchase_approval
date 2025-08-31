const pool = require('../config/database');

class WorkflowService {
  static getRequiredApprovalLevel(amount) {
    if (amount <= 5000) return 1;
    if (amount <= 25000) return 2;
    return 3;
  }

  static getDeadlineHours(level) {
    switch (level) {
      case 1: return 24;
      case 2: return 48;
      case 3: return 72;
      default: return 24;
    }
  }

  static async getNextApprover(requesterId, department, level, amount) {
    try {
      let query;
      let params;

      switch (level) {
        case 1:
          // Get direct manager
          query = `
            SELECT u.id, u.name, u.email, u.role 
            FROM users u 
            JOIN users requester ON requester.manager_id = u.id 
            WHERE requester.id = $1 AND u.is_active = true
          `;
          params = [requesterId];
          break;

        case 2:
          // Get department head (manager in same department)
          query = `
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'Manager' AND department = $1 AND is_active = true
            LIMIT 1
          `;
          params = [department];
          break;

        case 3:
          // Get executive
          query = `
            SELECT id, name, email, role 
            FROM users 
            WHERE role = 'Executive' AND is_active = true
            LIMIT 1
          `;
          params = [];
          break;

        default:
          return null;
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
      console.error('Error getting next approver:', error);
      return null;
    }
  }

  static async routeToNextLevel(requestId, currentLevel) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get request details
      const requestResult = await client.query(
        'SELECT * FROM purchase_requests WHERE id = $1',
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        throw new Error('Request not found');
      }

      const request = requestResult.rows[0];
      const requiredLevel = this.getRequiredApprovalLevel(request.amount);
      const nextLevel = currentLevel + 1;

      if (nextLevel > requiredLevel) {
        // Request is fully approved
        await client.query(
          'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
          ['Approved', requestId]
        );
      } else {
        // Route to next level
        const nextApprover = await this.getNextApprover(
          request.requester_id, 
          request.department, 
          nextLevel, 
          request.amount
        );

        if (!nextApprover) {
          throw new Error(`No approver found for level ${nextLevel}`);
        }

        const deadlineHours = this.getDeadlineHours(nextLevel);
        const newDeadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);

        await client.query(
          'UPDATE purchase_requests SET status = $1, current_approver_id = $2, deadline_date = $3, updated_at = NOW() WHERE id = $4',
          [`Pending_L${nextLevel}`, nextApprover.id, newDeadline, requestId]
        );
      }

      await client.query('COMMIT');
      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error routing to next level:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async checkEscalation(requestId) {
    try {
      const result = await pool.query(
        'SELECT id, deadline_date, status FROM purchase_requests WHERE id = $1 AND status LIKE $2',
        [requestId, 'Pending_%']
      );

      if (result.rows.length === 0) {
        return false;
      }

      const request = result.rows[0];
      const now = new Date();
      const deadline = new Date(request.deadline_date);

      return now > deadline;

    } catch (error) {
      console.error('Error checking escalation:', error);
      return false;
    }
  }

  static async getOverdueRequests() {
    try {
      const result = await pool.query(`
        SELECT pr.*, u.name as approver_name, u.email as approver_email
        FROM purchase_requests pr
        LEFT JOIN users u ON pr.current_approver_id = u.id
        WHERE pr.status LIKE 'Pending_%' AND pr.deadline_date < NOW()
        ORDER BY pr.deadline_date ASC
      `);

      return result.rows;

    } catch (error) {
      console.error('Error getting overdue requests:', error);
      return [];
    }
  }
}

module.exports = WorkflowService;