# InheritX - Secure Digital Inheritance Platform

<div align="center">
  <img src="client/public/img/logo.svg" alt="InheritX Logo" width="120">
  
  **A decentralized inheritance platform built on Lisk**
  
  [![Solidity](https://img.shields.io/badge/Solidity-0.8.22-blue.svg)](https://soliditylang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 🌟 Overview

InheritX enables users to create secure inheritance plans using smart contracts on the Lisk blockchain. The platform automates asset transfers based on selected timeframes and provides a complete solution for digital legacy management.

### Key Features

- **🔐 Secure Plan Creation** - Create inheritance plans with encrypted claim codes and hashed beneficiary data
- **⏰ Flexible Distribution** - Choose from Lump Sum, Monthly, Quarterly, or Yearly distributions
- **✅ KYC Verification** - Built-in identity verification system with admin approval
- **📧 Automated Notifications** - Cron jobs send claim notifications when plans become due
- **🛡️ Privacy-First** - Beneficiary information is hashed (keccak256) before on-chain storage
- **👥 Multi-Beneficiary Support** - Up to 10 beneficiaries per plan with custom allocations
- **🔄 UUPS Upgradeable** - Smart contract can be upgraded without losing state

---

## 🏗️ Architecture

```
inheritx_dapp/
├── contracts/           # Solidity smart contracts
│   ├── InheritX.sol    # Main inheritance contract
│   └── MockERC20.sol   # Test tokens
├── client/             # Next.js frontend
│   ├── app/            # App router pages
│   ├── src/            # Components, hooks, utilities
│   └── public/         # Static assets
├── server/             # Node.js backend
│   ├── src/            # API routes, services
│   ├── prisma/         # Database schema
│   └── cron/           # Scheduled tasks
└── scripts/            # Deployment scripts
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- MetaMask or compatible wallet

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/inheritx_dapp.git
cd inheritx_dapp

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Environment Setup

**Client (`client/.env.local`):**
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

**Server (`server/.env`):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inheritx"
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_CLAIM_CODE_SECRET="your-claim-code-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Deploy Smart Contract

```bash
cd client
npm run deploy:lisk-sepolia
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📋 How It Works

### 1. User Registration & KYC

1. User connects wallet
2. Signs message to authenticate
3. Submits KYC documents (ID, personal info)
4. Admin reviews and approves/rejects KYC

### 2. Creating an Inheritance Plan

1. **Plan Details**: Enter name, description, asset type, amount
2. **Distribution Method**: Choose Lump Sum, Monthly, Quarterly, or Yearly
3. **Beneficiaries**: Add up to 10 beneficiaries with percentage allocations
4. **Review & Create**: 
   - Backend stores unhashed data + encrypted claim code
   - Frontend sends hashed data to smart contract
   - Plan is created on-chain

### 3. Claim Process

1. When transfer date arrives, cron job sends email notifications
2. Beneficiary visits claim page with link from email
3. Enters claim code + personal details (name, email, relationship)
4. System verifies data by hashing and comparing to on-chain values
5. If valid, beneficiary can claim their share via smart contract

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      PLAN CREATION                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend → Backend: Plain text data (stored encrypted)     │
│  Frontend → Contract: Hashed data (keccak256)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LOCATIONS                        │
├─────────────────────────────────────────────────────────────┤
│  Backend DB: Plan name, description, beneficiary details,   │
│              encrypted claim code, email addresses          │
│                                                             │
│  Smart Contract: Plan hashes, beneficiary hashes,           │
│                  claim code hash, asset amounts             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLAIM PROCESS                          │
├─────────────────────────────────────────────────────────────┤
│  1. Cron decrypts claim code → Sends to beneficiary email   │
│  2. Claimer enters plain text data                          │
│  3. Contract hashes input → Compares with stored hashes     │
│  4. If match → Assets transferred                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Smart Contract

### Key Functions

```solidity
// Create inheritance plan with hashed data
function createInheritancePlan(
    bytes32 planNameHash,
    bytes32 planDescriptionHash,
    BeneficiaryInput[] calldata beneficiaries,
    uint8 assetType,
    uint256 assetAmount,
    uint8 distributionMethod,
    uint64 transferDate,
    uint8 periodicPercentage,
    bytes32 claimCodeHash
) external returns (uint256);

// Claim inheritance by providing original unhashed data
function claimInheritance(
    uint256 planId,
    string calldata claimCode,
    string calldata beneficiaryName,
    string calldata beneficiaryEmail,
    string calldata beneficiaryRelationship,
    uint256 beneficiaryIndex
) external;

// KYC management
function submitKYC(bytes32 kycDataHash) external;
function approveKYC(address user) external;
function rejectKYC(address user) external;
```

### Events

```solidity
event PlanCreated(uint256 indexed globalPlanId, uint256 indexed userPlanId, address indexed owner, ...);
event InheritanceClaimed(uint256 indexed planId, address indexed claimer, uint256 amount, ...);
event KYCStatusChanged(address indexed user, KYCStatus oldStatus, KYCStatus newStatus, ...);
```

---

## 🖥️ API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/nonce` | Get nonce for wallet signature |
| POST | `/api/auth/login` | Login with wallet signature |
| GET | `/api/auth/me` | Get current user |

### KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kyc/status` | Get KYC status |
| POST | `/api/kyc/submit` | Submit KYC documents |

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | Get user's plans |
| POST | `/api/plans` | Create new plan |
| PUT | `/api/plans/:id/status` | Update plan status |

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claim/plan/:id` | Get plan info for claiming |
| POST | `/api/claim/verify` | Verify claim data |
| POST | `/api/claim/complete` | Mark claim complete |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/kyc` | List KYC applications |
| POST | `/api/admin/kyc/:id/approve` | Approve KYC |
| POST | `/api/admin/kyc/:id/reject` | Reject KYC |

---

## 🎨 Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | User dashboard |
| `/dashboard/plans` | Manage plans |
| `/dashboard/kyc` | KYC verification |
| `/claim/:planId` | Claim page for beneficiaries |
| `/admin` | Admin dashboard |
| `/admin/kyc` | Admin KYC management |
| `/admin/users` | User management |

---

## 🔒 Security Considerations

- **Claim Codes**: Encrypted with JWT secret in backend, hashed on-chain
- **Beneficiary Data**: Hashed (keccak256) before on-chain storage
- **KYC Data**: Only hash stored on-chain, full data in secure database
- **Access Control**: RBAC with ADMIN and SUPER_ADMIN roles
- **Rate Limiting**: API endpoints protected against abuse
- **CORS**: Configured for frontend origin only

---

## 📊 Database Schema

Key models:
- `User` - Wallet addresses and roles
- `KYC` - Identity verification data
- `Plan` - Inheritance plans with encrypted claim codes
- `Beneficiary` - Plan beneficiaries (hashed + unhashed data)
- `Distribution` - Periodic distribution schedules
- `Activity` - Audit log

---

## 🧪 Testing

```bash
# Run smart contract tests
cd client && npm test

# Run backend tests
cd server && npm test
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📞 Support

- **Documentation**: [docs.inheritx.io](https://docs.inheritx.io)
- **Discord**: [discord.gg/inheritx](https://discord.gg/inheritx)
- **Twitter**: [@InheritX](https://twitter.com/InheritX)

---

<div align="center">
  <p>Built with ❤️ on <strong>Lisk</strong></p>
  <p>Secure your digital legacy today</p>
</div>