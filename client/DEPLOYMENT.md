# InheritX Contract Deployment Guide

This guide explains how to deploy and manage the InheritX smart contract.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Wallet with ETH** for gas fees on target network
3. **RPC URL** for your target network (Alchemy, Infura, etc.)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Commands

### Compile Contracts

```bash
npm run compile
```

### Deploy to Local Network (for testing)

```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy
npm run deploy:local
```

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

### Deploy to Lisk Sepolia Testnet

```bash
npm run deploy:lisk-sepolia
```

### Deploy to Mainnet

```bash
npm run deploy:mainnet
```

## Mock Tokens (for Testing)

If you need test tokens on testnet:

```bash
# Deploy mock tokens to Sepolia
npm run deploy:mock-tokens sepolia

# Deploy mock tokens to Lisk Sepolia
npm run deploy:mock-tokens liskSepolia
```

## Upgrading the Contract

Since InheritX uses UUPS proxy pattern, you can upgrade:

```bash
# Upgrade on Sepolia
npm run upgrade:sepolia

# Upgrade on Lisk Sepolia
npm run upgrade:lisk-sepolia
```

## After Deployment

### 1. Update Frontend Environment

Add the deployed proxy address to your `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_your_proxy_address
```

### 2. Generate ABI

After compilation, copy the ABI from:
```
artifacts/contracts/InheritX.sol/InheritX.json
```

Update `src/contract/abi.ts` with the new ABI.

### 3. Verify Contract

```bash
# Verify on Sepolia
npx hardhat verify --network sepolia <IMPLEMENTATION_ADDRESS>

# Verify on Lisk Sepolia (via Blockscout)
npx hardhat verify --network liskSepolia <IMPLEMENTATION_ADDRESS>
```

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Sepolia | 11155111 | `https://eth-sepolia.g.alchemy.com/v2/...` |
| Lisk Sepolia | 4202 | `https://rpc.sepolia-api.lisk.com` |
| Mainnet | 1 | `https://eth-mainnet.g.alchemy.com/v2/...` |

## Token Addresses

### Sepolia Testnet
- **WETH**: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
- **USDC**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Lisk Sepolia
- Deploy mock tokens using the provided script

## Contract Functions Summary

### For Users
- `createInheritancePlan()` - Create new inheritance plan
- `claimInheritance()` - Claim inheritance as beneficiary
- `recordActivity()` - Reset inactivity timer
- `pausePlan()` / `resumePlan()` - Pause/resume plan
- `cancelPlan()` - Cancel and refund plan

### For Admin
- `updateFeeConfig()` - Update fee settings
- `updateSecuritySettings()` - Update security config
- `updateTokenAddresses()` - Update supported tokens
- `pause()` / `unpause()` - Emergency pause
- `emergencyWithdraw()` - Emergency withdrawal

## Fee Structure

- **Plan Creation Fee**: 5% (500 basis points)
- **Service Fee**: 2% (200 basis points, configurable)

## Troubleshooting

### "Insufficient funds" error
Ensure your deployer wallet has enough ETH for gas.

### "Invalid initialization" error
The proxy is already initialized. You cannot re-initialize.

### Compilation errors
Run `npx hardhat clean` then `npm run compile`.

### "Module not found" errors
Delete `node_modules` and `package-lock.json`, then run `npm install`.

## Security Notes

1. **Never commit private keys** to version control
2. **Use hardware wallets** for mainnet deployments
3. **Test thoroughly** on testnets before mainnet
4. **Have the contract audited** before production use

## Support

For issues or questions, please open an issue on GitHub.

