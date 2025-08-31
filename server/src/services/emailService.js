const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendApprovalNotification(approver, request) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: approver.email,
        subject: `Purchase Request Approval Required - ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Purchase Request Approval Required</h2>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Request Details</h3>
              <p><strong>Requester:</strong> ${request.requester_name}</p>
              <p><strong>Department:</strong> ${request.department}</p>
              <p><strong>Amount:</strong> ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              <p><strong>Category:</strong> ${request.category}</p>
              <p><strong>Description:</strong> ${request.description}</p>
              <p><strong>Urgency:</strong> ${request.urgency}</p>
              <p><strong>Deadline:</strong> ${new Date(request.deadline_date).toLocaleDateString()}</p>
            </div>

            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Business Justification</h3>
              <p style="color: #374151;">${request.justification}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/approvals" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Request
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Please review and approve this request by ${new Date(request.deadline_date).toLocaleDateString()}.
              If you have any questions, please contact ${request.requester_name} directly.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Approval notification sent', { 
        to: approver.email, 
        requestId: request.id 
      });

    } catch (error) {
      logger.error('Failed to send approval notification', { 
        error: error.message, 
        approver: approver.email, 
        requestId: request.id 
      });
    }
  }

  async sendStatusNotification(user, request, status) {
    try {
      const subject = `Purchase Request ${status} - ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${status === 'Approved' ? '#059669' : '#dc2626'};">
              Purchase Request ${status}
            </h2>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Description:</strong> ${request.description}</p>
              <p><strong>Amount:</strong> ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/my-requests" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Request Details
              </a>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Status notification sent', { 
        to: user.email, 
        requestId: request.id, 
        status 
      });

    } catch (error) {
      logger.error('Failed to send status notification', { 
        error: error.message, 
        user: user.email, 
        requestId: request.id 
      });
    }
  }

  async sendEscalationAlert(approver, request) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: approver.email,
        subject: `URGENT: Overdue Purchase Request - ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0;">⚠️ OVERDUE APPROVAL REQUIRED</h2>
            </div>
            
            <p>The following purchase request is overdue and requires immediate attention:</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Requester:</strong> ${request.requester_name}</p>
              <p><strong>Amount:</strong> ${request.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              <p><strong>Description:</strong> ${request.description}</p>
              <p><strong>Original Deadline:</strong> ${new Date(request.deadline_date).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${Math.ceil((new Date() - new Date(request.deadline_date)) / (1000 * 60 * 60 * 24))}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/pending-approvals" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Immediately
              </a>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Escalation alert sent', { 
        to: approver.email, 
        requestId: request.id 
      });

    } catch (error) {
      logger.error('Failed to send escalation alert', { 
        error: error.message, 
        approver: approver.email, 
        requestId: request.id 
      });
    }
  }
}

module.exports = new EmailService();