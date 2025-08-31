# Purchase Approval System Backend

A comprehensive Node.js/Express backend for the enterprise purchase approval system with PostgreSQL database.

## Features

- **Three-tier approval workflow** with automatic routing
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (Employee/Manager/Executive)
- **Real-time notifications** system
- **Comprehensive audit logging** for compliance
- **Advanced analytics** and reporting
- **Bulk operations** for efficient management
- **Input validation** and error handling
- **Rate limiting** and security middleware

## Quick Start

### Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd server
   npm install
   ```

2. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb purchase_approval
   
   # Copy environment file
   cp .env.example .env
   
   # Edit .env with your database credentials
   nano .env
   ```

3. **Run migrations and seed data**
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/purchase_approval
DB_HOST=localhost
DB_PORT=5432
DB_NAME=purchase_approval
DB_USER=username
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
```

## API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Purchase Requests

#### Create Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "IT Equipment",
  "description": "MacBook Pro for development",
  "vendor": "Apple Inc.",
  "vendor_contact": "sales@apple.com",
  "amount": 3500,
  "urgency": "High",
  "budget_code": "IT-2024-001",
  "justification": "Current laptop is failing",
  "expected_delivery": "2024-02-15",
  "attachments": ["quote.pdf"]
}
```

#### Get Requests
```http
GET /api/requests?page=1&limit=10&status=Pending_L1
Authorization: Bearer <token>
```

### Approvals

#### Approve Request
```http
POST /api/approvals/{id}/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Approved for business needs"
}
```

#### Bulk Approval
```http
POST /api/approvals/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestIds": ["req-001", "req-002"],
  "action": "approve",
  "comments": "Bulk approval for Q1 requests"
}
```

## Database Schema

### Core Tables

- **users**: User authentication and profile data
- **purchase_requests**: Main request data with workflow status
- **approval_steps**: Complete approval history
- **notifications**: Real-time notification system
- **budget_codes**: Budget management
- **audit_logs**: Complete audit trail

### Key Relationships

```sql
users (1) -> (many) purchase_requests
purchase_requests (1) -> (many) approval_steps
users (1) -> (many) notifications
users (1) -> (many) audit_logs
```

## Workflow Logic

### Approval Levels

- **Level 1**: $0 - $5,000 (Manager approval)
- **Level 2**: $5,001 - $25,000 (Department head approval)
- **Level 3**: $25,001+ (Executive approval)

### Auto-routing

1. Request submitted by employee
2. System determines required approval levels
3. Routes to appropriate approver
4. Sends notifications
5. Tracks deadlines and escalates if needed

## Security Features

- **JWT authentication** with secure token handling
- **Password hashing** using bcrypt
- **Rate limiting** to prevent abuse
- **Input validation** on all endpoints
- **SQL injection protection** with parameterized queries
- **CORS configuration** for frontend integration
- **Helmet.js** for security headers

## Monitoring & Logging

- **Winston logging** for application logs
- **Audit trail** for all user actions
- **Health check endpoint** for monitoring
- **Error tracking** with detailed logging

## Testing

```bash
# Run tests (when implemented)
npm test

# Check health
curl http://localhost:3001/health
```

## Deployment

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure email service
- [ ] Set up monitoring
- [ ] Configure backup strategy

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Follow security best practices

## License

MIT License - see LICENSE file for details