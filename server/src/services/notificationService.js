const pool = require('../config/database');

class NotificationService {
  static async sendNotification(userId, notification) {
    try {
      const result = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, request_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        userId,
        notification.title,
        notification.message,
        notification.type || 'info',
        notification.request_id || null
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const offset = (page - 1) * limit;

      let query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      const params = [userId];

      if (unreadOnly) {
        query += ' AND read = false';
      }

      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
      const countParams = [userId];

      if (unreadOnly) {
        countQuery += ' AND read = false';
        countParams.push();
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        notifications: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET read = true WHERE user_id = $1 AND read = false RETURNING COUNT(*)',
        [userId]
      );

      return result.rowCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;