const pool = require('../config/database');

const getDashboardMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Base query conditions based on role
    let whereCondition = '';
    let params = [];

    if (userRole === 'Employee') {
      whereCondition = 'WHERE pr.requester_id = $1';
      params = [userId];
    } else if (userRole === 'Manager') {
      whereCondition = 'WHERE pr.department = $1';
      params = [userDepartment];
    }
    // Executives see all data

    // Get basic metrics
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'Approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status LIKE 'Pending_%') as pending_count,
        SUM(amount) as total_value,
        SUM(amount) FILTER (WHERE status = 'Approved') as approved_value,
        AVG(amount) as avg_amount,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_requests
      FROM purchase_requests pr
      ${whereCondition}
    `;

    const metricsResult = await pool.query(metricsQuery, params);
    const metrics = metricsResult.rows[0];

    // Get category breakdown
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM purchase_requests pr
      ${whereCondition}
      GROUP BY category
      ORDER BY total_amount DESC
    `;

    const categoryResult = await pool.query(categoryQuery, params);

    // Get monthly trend (last 6 months)
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM purchase_requests pr
      ${whereCondition}
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `;

    const trendResult = await pool.query(trendQuery, params);

    res.json({
      metrics: {
        totalRequests: parseInt(metrics.total_requests),
        approvedCount: parseInt(metrics.approved_count),
        rejectedCount: parseInt(metrics.rejected_count),
        pendingCount: parseInt(metrics.pending_count),
        totalValue: parseFloat(metrics.total_value) || 0,
        approvedValue: parseFloat(metrics.approved_value) || 0,
        avgAmount: parseFloat(metrics.avg_amount) || 0,
        recentRequests: parseInt(metrics.recent_requests)
      },
      categoryBreakdown: categoryResult.rows,
      monthlyTrend: trendResult.rows
    });

  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getReports = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      department, 
      category, 
      status,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT pr.*, 
             u.name as requester_name,
             u.department as requester_department
      FROM purchase_requests pr
      JOIN users u ON pr.requester_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (userRole === 'Employee') {
      query += ` AND pr.requester_id = $${++paramCount}`;
      params.push(userId);
    } else if (userRole === 'Manager') {
      query += ` AND pr.department = $${++paramCount}`;
      params.push(req.user.department);
    }

    // Date filtering
    if (start_date) {
      query += ` AND pr.created_at >= $${++paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND pr.created_at <= $${++paramCount}`;
      params.push(end_date);
    }

    // Additional filters
    if (department) {
      query += ` AND pr.department = $${++paramCount}`;
      params.push(department);
    }

    if (category) {
      query += ` AND pr.category = $${++paramCount}`;
      params.push(category);
    }

    if (status) {
      query += ` AND pr.status = $${++paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY pr.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*/, '');
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await pool.query(countQuery, countParams);

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
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getBudgetUtilization = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    let query = `
      SELECT 
        bc.code,
        bc.description,
        bc.department,
        bc.allocated_amount,
        COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'Approved'), 0) as spent_amount,
        COALESCE(SUM(pr.amount) FILTER (WHERE pr.status LIKE 'Pending_%'), 0) as pending_amount,
        COUNT(pr.id) FILTER (WHERE pr.status = 'Approved') as approved_requests,
        COUNT(pr.id) FILTER (WHERE pr.status LIKE 'Pending_%') as pending_requests
      FROM budget_codes bc
      LEFT JOIN purchase_requests pr ON bc.code = pr.budget_code
      WHERE bc.is_active = true
    `;

    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (userRole !== 'Executive') {
      query += ` AND bc.department = $${++paramCount}`;
      params.push(userDepartment);
    }

    query += `
      GROUP BY bc.code, bc.description, bc.department, bc.allocated_amount
      ORDER BY bc.department, bc.code
    `;

    const result = await pool.query(query, params);

    const budgetData = result.rows.map(row => ({
      code: row.code,
      description: row.description,
      department: row.department,
      allocated: parseFloat(row.allocated_amount),
      spent: parseFloat(row.spent_amount),
      pending: parseFloat(row.pending_amount),
      approvedRequests: parseInt(row.approved_requests),
      pendingRequests: parseInt(row.pending_requests),
      utilization: ((parseFloat(row.spent_amount) + parseFloat(row.pending_amount)) / parseFloat(row.allocated_amount)) * 100
    }));

    res.json(budgetData);

  } catch (error) {
    console.error('Get budget utilization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboardMetrics,
  getReports,
  getBudgetUtilization
};