import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * InheritX Contract Deployment Script
 * 
 * This script deploys the InheritX UUPS upgradeable contract.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network <network-name>
 * 
 * Examples:
 *   npx hardhat run scripts/deploy.ts --network localhost
 *   npx hardhat run scripts/deploy.ts --network sepolia
 *   npx hardhat run scripts/deploy.ts --network liskSepolia
 */

interface DeploymentConfig {
  admin: string;
  dexRouter: string;
  emergencyWithdrawAddress: string;
  primaryToken: string;
  usdtToken: string;
  usdcToken: string;
}

// Network-specific deployment configurations
const deploymentConfigs: Record<string, DeploymentConfig> = {
  // Local development - uses mock addresses
  localhost: {
    admin: "", // Will be set to deployer
    dexRouter: "0x0000000000000000000000000000000000000000",
    emergencyWithdrawAddress: "", // Will be set to deployer
    primaryToken: "0x0000000000000000000000000000000000000001", // Placeholder
    usdtToken: "0x0000000000000000000000000000000000000002", // Placeholder
    usdcToken: "0x0000000000000000000000000000000000000003", // Placeholder
  },
  // Hardhat local network
  hardhat: {
    admin: "",
    dexRouter: "0x0000000000000000000000000000000000000000",
    emergencyWithdrawAddress: "",
    primaryToken: "0x0000000000000000000000000000000000000001",
    usdtToken: "0x0000000000000000000000000000000000000002",
    usdcToken: "0x0000000000000000000000000000000000000003",
  },
  // Ethereum Sepolia Testnet
  sepolia: {
    admin: "", // Will be set to deployer
    dexRouter: "0x0000000000000000000000000000000000000000", // No DEX router for MVP
    emergencyWithdrawAddress: "", // Will be set to deployer
    // Sepolia test token addresses (you may need to deploy your own test tokens)
    primaryToken: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // WETH on Sepolia
    usdtToken: "0x0000000000000000000000000000000000000000", // Deploy mock or use existing
    usdcToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
  },
  // Lisk Sepolia Testnet
  liskSepolia: {
    admin: "", // Will be set to deployer
    dexRouter: "0x0000000000000000000000000000000000000000",
    emergencyWithdrawAddress: "", // Will be set to deployer
    // Lisk Sepolia token addresses - update these with actual addresses
    primaryToken: "0x0000000000000000000000000000000000000000", // Update with actual
    usdtToken: "0x0000000000000000000000000000000000000000", // Update with actual
    usdcToken: "0x0000000000000000000000000000000000000000", // Update with actual
  },
};

async function main() {
  console.log("\n========================================");
  console.log("   InheritX Contract Deployment");
  console.log("========================================\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log(`📡 Network: ${networkName} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n) {
    throw new Error("Deployer has no ETH balance!");
  }

  // Get deployment config for this network
  let config = deploymentConfigs[networkName] || deploymentConfigs.localhost;

  // Set deployer as admin and emergency address if not specified
  if (!config.admin) {
    config.admin = deployer.address;
  }
  if (!config.emergencyWithdrawAddress) {
    config.emergencyWithdrawAddress = deployer.address;
  }

  console.log("📋 Deployment Configuration:");
  console.log(`   Admin: ${config.admin}`);
  console.log(`   DEX Router: ${config.dexRouter}`);
  console.log(`   Emergency Withdraw: ${config.emergencyWithdrawAddress}`);
  console.log(`   Primary Token: ${config.primaryToken}`);
  console.log(`   USDT Token: ${config.usdtToken}`);
  console.log(`   USDC Token: ${config.usdcToken}\n`);

  // Deploy the contract
  console.log("🚀 Deploying InheritX contract...\n");

  const InheritX = await ethers.getContractFactory("InheritX");

  // Deploy as upgradeable proxy (UUPS)
  const inheritX = await upgrades.deployProxy(
    InheritX,
    [
      config.admin,
      config.dexRouter,
      config.emergencyWithdrawAddress,
      config.primaryToken,
      config.usdtToken,
      config.usdcToken,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await inheritX.waitForDeployment();

  const proxyAddress = await inheritX.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Deployment Successful!\n");
  console.log("📝 Contract Addresses:");
  console.log(`   Proxy Address: ${proxyAddress}`);
  console.log(`   Implementation Address: ${implementationAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    proxyAddress,
    implementationAddress,
    deployer: deployer.address,
    config,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}\n`);

  // Update .env.local with contract address
  console.log("========================================");
  console.log("   📌 IMPORTANT: Update Your .env File");
  console.log("========================================\n");
  console.log(`Add this to your .env.local file:\n`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${proxyAddress}\n`);

  // Verification instructions
  console.log("========================================");
  console.log("   🔍 Contract Verification");
  console.log("========================================\n");
  console.log("To verify the contract on Etherscan/Blockscout, run:\n");
  console.log(`npx hardhat verify --network ${networkName} ${implementationAddress}\n`);

  return {
    proxyAddress,
    implementationAddress,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

