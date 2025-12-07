# InheritX Deployment Guide

Complete guide for deploying the InheritX contract to any network.

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** configured (already set up in this project)
3. **Testnet/Mainnet Access**
   - For Lisk Sepolia: Get testnet ETH from https://faucet.sepolia-api.lisk.com/
   - For Ethereum Sepolia: Get testnet ETH from any Sepolia faucet
   - For Mainnet: Ensure you have sufficient ETH for gas

## Environment Setup

1. Create a `.env` file in the project root:

```bash
# Deployer wallet private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Network RPC URLs (as needed)
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key

# Optional: Skip mock token deployment if you have existing tokens
SKIP_MOCK_TOKENS=false

# Optional: Skip contract verification (not recommended)
SKIP_VERIFICATION=false

# Optional: Use existing token addresses (if SKIP_MOCK_TOKENS=true)
PRIMARY_TOKEN_ADDRESS=
USDT_TOKEN_ADDRESS=
USDC_TOKEN_ADDRESS=

# Optional: Admin address (defaults to deployer)
ADMIN_ADDRESS=
```

2. **⚠️ Security Warning**: Never commit your `.env` file or private keys to version control!

## Deployment

### Single Command Deployment

The deployment script handles everything automatically:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network <network-name>
```

**Examples:**

```bash
# Deploy to Lisk Sepolia
npx hardhat run scripts/deploy.ts --network liskSepolia

# Deploy to Ethereum Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to localhost (for testing)
npx hardhat run scripts/deploy.ts --network localhost
```

### What the Script Does

1. **Checks Network & Balance**
   - Verifies you're on the correct network
   - Checks deployer wallet balance

2. **Deploys Mock Tokens** (if needed)
   - Automatically deploys 3 mock ERC20 tokens (WETH, USDT, USDC)
   - Mints tokens to deployer for testing
   - Saves token addresses for future use
   - Verifies tokens on explorer

3. **Deploys InheritX Contract**
   - Deploys implementation contract
   - Deploys ERC1967Proxy (UUPS upgradeable)
   - Initializes contract with admin and token addresses
   - Verifies deployment configuration

4. **Verifies Contracts**
   - Verifies implementation contract on Blockscout/Etherscan
   - Verifies mock tokens (if deployed)

5. **Saves Deployment Info**
   - Saves all addresses to `deployments/<network>.json`
   - Displays environment variables for frontend

## Deployment Output

After successful deployment, you'll see:

```
✅ Deployment Successful!

📝 Contract Addresses:
   Proxy Address: 0x...
   Implementation Address: 0x...

✅ All contracts verified successfully!

📁 Deployment info saved to: deployments/liskSepolia.json

📌 IMPORTANT: Update Your .env File
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_TOKEN1_ADDRESS=0x...
NEXT_PUBLIC_TOKEN2_ADDRESS=0x...
NEXT_PUBLIC_TOKEN3_ADDRESS=0x...
```

## Using Existing Tokens

If you already have token addresses and want to skip mock token deployment:

```bash
# Set environment variables
export PRIMARY_TOKEN_ADDRESS=0x...
export USDT_TOKEN_ADDRESS=0x...
export USDC_TOKEN_ADDRESS=0x...
export SKIP_MOCK_TOKENS=true

# Deploy
npx hardhat run ../contracts/scripts/deploy.ts --network liskSepolia
```

Or the script will automatically use tokens from a previous deployment if found in `deployments/tokens-<network>.json`.

## Network-Specific Information

### Lisk Sepolia
- **Chain ID**: 4202
- **RPC URL**: https://rpc.sepolia-api.lisk.com
- **Explorer**: https://sepolia-blockscout.lisk.com
- **Faucet**: https://faucet.sepolia-api.lisk.com/

### Ethereum Sepolia
- **Chain ID**: 11155111
- **RPC URL**: Use Alchemy/Infura
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: Various available

### Ethereum Mainnet
- **Chain ID**: 1
- **RPC URL**: Use Alchemy/Infura
- **Explorer**: https://etherscan.io
- **⚠️ Use with caution - real funds!**

## Post-Deployment

1. **Update Frontend Environment**
   
   Add to `client/.env.local`:
   ```bash
   NEXT_PUBLIC_CONTRACT_ADDRESS=<proxy_address>
   NEXT_PUBLIC_TOKEN1_ADDRESS=<primary_token>
   NEXT_PUBLIC_TOKEN2_ADDRESS=<usdt_token>
   NEXT_PUBLIC_TOKEN3_ADDRESS=<usdc_token>
   ```

2. **Test the Deployment**
   - Connect wallet to the network
   - Approve KYC for a test user
   - Create a test inheritance plan
   - Verify all functions work correctly

3. **Verify Contracts** (if verification failed)
   
   Manual verification:
   ```bash
   npx hardhat verify --network <network> <implementation_address>
   ```

## Troubleshooting

### Error: "Deployer has no ETH balance"
- Get testnet ETH from the appropriate faucet
- For Lisk Sepolia: https://faucet.sepolia-api.lisk.com/

### Error: "Token address is required"
- The script will automatically deploy mock tokens
- Or set `SKIP_MOCK_TOKENS=true` and provide token addresses

### Error: "Verification failed"
- Check your API keys in hardhat.config.ts
- For Lisk Sepolia, Blockscout may have rate limits
- You can set `SKIP_VERIFICATION=true` to skip (not recommended)

### Error: "Wrong network!"
- Make sure you're connected to the correct network
- Check your wallet network settings
- Verify the network name matches hardhat.config.ts

## Deployment Files

All deployment information is saved to:
- `deployments/<network>.json` - Main contract deployment
- `deployments/tokens-<network>.json` - Token addresses

These files are automatically created and can be used for:
- Future upgrades
- Frontend configuration
- Documentation

## Contract Upgrade

To upgrade the contract later, use the upgrade script:

```bash
   npx hardhat run scripts/upgrade.ts --network <network-name>
```

## Support

For issues or questions:
- Check contract documentation in `contracts/InheritX.sol`
- Review test files in `contracts/test/InheritX.t.sol`
- Check Hardhat configuration in `client/hardhat.config.ts`
