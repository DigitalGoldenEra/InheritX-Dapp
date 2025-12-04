# InheritX Backend Server

A secure backend API for the InheritX digital inheritance platform built on Lisk.

## Features

- **User Authentication**: Wallet-based authentication using signature verification
- **KYC Management**: Submit and verify KYC documents
- **Plan Management**: Create and manage inheritance plans
- **Claim System**: Beneficiaries can verify and claim inheritance
- **Admin Dashboard**: Super admin endpoints for KYC verification
- **Cron Jobs**: Automated distribution notifications
- **Email Notifications**: Templated emails for claims and KYC status

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Wallet Signatures
- **Email**: Nodemailer

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository and navigate to server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Database URL
   - JWT secrets
   - SMTP credentials
   - Blockchain RPC URL
   - Contract address

5. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

6. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

7. Seed the database:
   ```bash
   npm run prisma:seed
   ```

### Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### Running Cron Jobs

Cron jobs run automatically with the server, or can be run standalone:
```bash
npm run cron:start
```

## API Endpoints

### Authentication
- `GET /api/auth/nonce` - Get nonce for wallet signature
- `POST /api/auth/login` - Login/register with wallet
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile

### KYC
- `GET /api/kyc/status` - Get KYC status
- `POST /api/kyc/submit` - Submit KYC documents
- `GET /api/kyc/hash` - Get KYC data hash for on-chain

### Plans
- `GET /api/plans` - Get user's plans
- `GET /api/plans/:id` - Get specific plan
- `POST /api/plans` - Create new plan
- `PUT /api/plans/:id/contract` - Update with on-chain data
- `PUT /api/plans/:id/status` - Update plan status
- `GET /api/plans/:id/claim-code` - Get decrypted claim code

### Claims
- `GET /api/claim/plan/:globalPlanId` - Get plan info for claiming
- `POST /api/claim/verify` - Verify claim before contract call
- `POST /api/claim/complete` - Mark claim as completed
- `GET /api/claim/my-claims` - Get claims by email

### Admin (requires ADMIN or SUPER_ADMIN role)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/kyc` - List KYC applications
- `GET /api/admin/kyc/:id` - Get KYC details
- `POST /api/admin/kyc/:id/approve` - Approve KYC
- `POST /api/admin/kyc/:id/reject` - Reject KYC
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/plans` - List all plans
- `GET /api/admin/activity` - Activity log

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| PORT | Server port (default: 3001) | No |
| NODE_ENV | Environment (development/production) | No |
| JWT_SECRET | JWT signing secret | Yes |
| JWT_CLAIM_CODE_SECRET | Claim code encryption secret | Yes |
| JWT_EXPIRES_IN | JWT expiration (default: 7d) | No |
| RPC_URL | Blockchain RPC URL | Yes |
| CONTRACT_ADDRESS | InheritX contract address | Yes |
| SMTP_HOST | SMTP server host | Yes |
| SMTP_PORT | SMTP server port | Yes |
| SMTP_USER | SMTP username | Yes |
| SMTP_PASS | SMTP password | Yes |
| SMTP_FROM | From email address | Yes |
| FRONTEND_URL | Frontend URL for email links | Yes |

## Database Schema

Key models:
- **User**: Wallet addresses and roles
- **KYC**: KYC submissions and verification status
- **Plan**: Inheritance plans with encrypted claim codes
- **Beneficiary**: Plan beneficiaries with hashed data
- **Distribution**: Periodic distribution schedules
- **Activity**: Audit log for all actions

## Security

- Claim codes are encrypted with JWT secret before storage
- Beneficiary data is hashed (keccak256) matching on-chain storage
- KYC data hash is stored on-chain for verification
- All admin endpoints require role verification
- Rate limiting on all endpoints
- CORS configured for frontend origin only

## License

MIT

