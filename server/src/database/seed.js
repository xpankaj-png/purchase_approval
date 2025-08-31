const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const seedData = {
  users: [
    {
      email: 'john.doe@company.com',
      password: 'password123',
      name: 'John Doe',
      role: 'Employee',
      department: 'Engineering',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      email: 'sarah.manager@company.com',
      password: 'password123',
      name: 'Sarah Manager',
      role: 'Manager',
      department: 'Engineering',
      avatar: 'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      email: 'alex.exec@company.com',
      password: 'password123',
      name: 'Alex Executive',
      role: 'Executive',
      department: 'C-Suite',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      email: 'maria.rodriguez@company.com',
      password: 'password123',
      name: 'Maria Rodriguez',
      role: 'Employee',
      department: 'Marketing',
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      email: 'david.wilson@company.com',
      password: 'password123',
      name: 'David Wilson',
      role: 'Manager',
      department: 'Marketing',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    }
  ],
  budgetCodes: [
    { code: 'IT-2024-001', description: 'IT Equipment and Software', department: 'Engineering', allocated_amount: 100000 },
    { code: 'MKT-2024-002', description: 'Marketing and Events', department: 'Marketing', allocated_amount: 75000 },
    { code: 'OPS-2024-003', description: 'Operations and Supplies', department: 'Operations', allocated_amount: 50000 },
    { code: 'HR-2024-004', description: 'Human Resources', department: 'HR', allocated_amount: 30000 },
    { code: 'FIN-2024-005', description: 'Finance and Accounting', department: 'Finance', allocated_amount: 25000 },
    { code: 'ENG-2024-006', description: 'Engineering Projects', department: 'Engineering', allocated_amount: 150000 }
  ]
};

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Seeding database...');
    
    // Clear existing data
    await client.query('TRUNCATE TABLE notifications, approval_steps, purchase_requests, budget_codes, users RESTART IDENTITY CASCADE');
    
    // Seed users
    console.log('Seeding users...');
    const userIds = {};
    
    for (const user of seedData.users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role, department, avatar) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [user.email, hashedPassword, user.name, user.role, user.department, user.avatar]
      );
      userIds[user.email] = result.rows[0].id;
    }
    
    // Set manager relationships
    await client.query(
      'UPDATE users SET manager_id = $1 WHERE email = $2',
      [userIds['sarah.manager@company.com'], 'john.doe@company.com']
    );
    await client.query(
      'UPDATE users SET manager_id = $1 WHERE email = $2',
      [userIds['david.wilson@company.com'], 'maria.rodriguez@company.com']
    );
    
    // Seed budget codes
    console.log('Seeding budget codes...');
    for (const budgetCode of seedData.budgetCodes) {
      await client.query(
        `INSERT INTO budget_codes (code, description, department, allocated_amount) 
         VALUES ($1, $2, $3, $4)`,
        [budgetCode.code, budgetCode.description, budgetCode.department, budgetCode.allocated_amount]
      );
    }
    
    // Seed sample purchase requests
    console.log('Seeding purchase requests...');
    const sampleRequests = [
      {
        requester_id: userIds['john.doe@company.com'],
        requester_name: 'John Doe',
        department: 'Engineering',
        category: 'IT Equipment',
        description: 'MacBook Pro 16" for development work',
        vendor: 'Apple Inc.',
        vendor_contact: 'sales@apple.com',
        amount: 3500,
        urgency: 'High',
        budget_code: 'IT-2024-001',
        justification: 'Current laptop is failing and impacting productivity',
        expected_delivery: new Date('2024-02-15'),
        attachments: ['quote-apple-macbook.pdf'],
        status: 'Pending_L1',
        current_approver_id: userIds['sarah.manager@company.com'],
        deadline_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        requester_id: userIds['maria.rodriguez@company.com'],
        requester_name: 'Maria Rodriguez',
        department: 'Marketing',
        category: 'Software',
        description: 'Adobe Creative Suite licenses for design team',
        vendor: 'Adobe Systems',
        vendor_contact: 'enterprise@adobe.com',
        amount: 15000,
        urgency: 'Normal',
        budget_code: 'MKT-2024-002',
        justification: 'Annual license renewal for creative software tools',
        expected_delivery: new Date('2024-02-01'),
        attachments: ['adobe-quote-2024.pdf'],
        status: 'Approved',
        deadline_date: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
    
    for (const request of sampleRequests) {
      const result = await client.query(
        `INSERT INTO purchase_requests (
          requester_id, requester_name, department, category, description, vendor, 
          vendor_contact, amount, urgency, budget_code, justification, expected_delivery, 
          attachments, status, current_approver_id, deadline_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
          request.requester_id, request.requester_name, request.department, request.category,
          request.description, request.vendor, request.vendor_contact, request.amount,
          request.urgency, request.budget_code, request.justification, request.expected_delivery,
          request.attachments, request.status, request.current_approver_id, request.deadline_date
        ]
      );
      
      // Add approval history for approved request
      if (request.status === 'Approved') {
        await client.query(
          `INSERT INTO approval_steps (request_id, level, approver_id, approver_name, action, comments, deadline)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            result.rows[0].id, 1, userIds['david.wilson@company.com'], 'David Wilson',
            'Approved', 'Approved. Essential tools for marketing team.', request.deadline_date
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDatabase;