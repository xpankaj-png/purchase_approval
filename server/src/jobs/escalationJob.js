const cron = require('node-cron');
const pool = require('../config/database');
const WorkflowService = require('../services/workflowService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

class EscalationJob {
  static start() {
    // Run every hour to check for overdue requests
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running escalation job...');
        await this.processOverdueRequests();
      } catch (error) {
        logger.error('Escalation job failed:', error);
      }
    });

    logger.info('Escalation job scheduled to run every hour');
  }

  static async processOverdueRequests() {
    try {
      const overdueRequests = await WorkflowService.getOverdueRequests();
      
      for (const request of overdueRequests) {
        await this.handleOverdueRequest(request);
      }

      if (overdueRequests.length > 0) {
        logger.info(`Processed ${overdueRequests.length} overdue requests`);
      }

    } catch (error) {
      logger.error('Error processing overdue requests:', error);
    }
  }

  static async handleOverdueRequest(request) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Send escalation alert to current approver
      if (request.approver_email) {
        await EmailService.sendEscalationAlert({
          email: request.approver_email,
          name: request.approver_name
        }, request);
      }

      // Check if we should auto-escalate
      const shouldEscalate = await this.shouldAutoEscalate(request);
      
      if (shouldEscalate) {
        await this.escalateRequest(client, request);
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error handling overdue request ${request.id}:`, error);
    } finally {
      client.release();
    }
  }

  static async shouldAutoEscalate(request) {
    // Auto-escalate after 48 hours overdue
    const overdueHours = (new Date() - new Date(request.deadline_date)) / (1000 * 60 * 60);
    return overdueHours >= 48;
  }

  static async escalateRequest(client, request) {
    try {
      const currentLevel = request.status === 'Pending_L1' ? 1 : 
                          request.status === 'Pending_L2' ? 2 : 3;
      
      const requiredLevel = WorkflowService.getRequiredApprovalLevel(request.amount);
      
      if (currentLevel < requiredLevel) {
        // Escalate to next level
        const nextLevel = currentLevel + 1;
        const nextApprover = await WorkflowService.getNextApprover(
          request.requester_id, 
          request.department, 
          nextLevel, 
          request.amount
        );

        if (nextApprover) {
          const newDeadline = new Date(Date.now() + WorkflowService.getDeadlineHours(nextLevel) * 60 * 60 * 1000);

          await client.query(
            'UPDATE purchase_requests SET status = $1, current_approver_id = $2, deadline_date = $3, updated_at = NOW() WHERE id = $4',
            [`Pending_L${nextLevel}`, nextApprover.id, newDeadline, request.id]
          );

          // Send notification to new approver
          await EmailService.sendApprovalNotification(nextApprover, {
            ...request,
            deadline_date: newDeadline
          });

          logger.info(`Request ${request.id} escalated to level ${nextLevel}`);
        }
      } else {
        // Auto-approve if at highest level and severely overdue
        const overdueHours = (new Date() - new Date(request.deadline_date)) / (1000 * 60 * 60);
        
        if (overdueHours >= 168) { // 7 days overdue
          await client.query(
            'UPDATE purchase_requests SET status = $1, current_approver_id = NULL, updated_at = NOW() WHERE id = $2',
            ['Approved', request.id]
          );

          // Create auto-approval step
          await client.query(`
            INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            request.id, 
            currentLevel, 
            'system', 
            'System Auto-Approval', 
            'Approved', 
            'Auto-approved due to extended overdue period', 
            new Date()
          ]);

          logger.info(`Request ${request.id} auto-approved due to extended overdue period`);
        }
      }

    } catch (error) {
      logger.error(`Error escalating request ${request.id}:`, error);
      throw error;
    }
  }
}

module.exports = EscalationJob;