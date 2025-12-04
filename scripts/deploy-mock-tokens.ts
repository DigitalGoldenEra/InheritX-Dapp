import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Mock Token Deployment Script
 * 
 * Deploys mock ERC20 tokens for testing on testnets.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-mock-tokens.ts --network <network-name>
 */

async function main() {
  console.log("\n========================================");
  console.log("   Mock Token Deployment");
  console.log("========================================\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log(`📡 Network: ${networkName} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy MockERC20 contract
  console.log("🚀 Deploying Mock Tokens...\n");

  const MockERC20 = await ethers.getContractFactory("MockERC20");

  // Deploy Primary Token (18 decimals)
  console.log("Deploying Primary Token (WETH mock)...");
  const primaryToken = await MockERC20.deploy("Wrapped ETH", "WETH", 18);
  await primaryToken.waitForDeployment();
  const primaryAddress = await primaryToken.getAddress();
  console.log(`   Primary Token (WETH): ${primaryAddress}`);

  // Deploy USDT (6 decimals, like real USDT)
  console.log("Deploying USDT mock...");
  const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(`   USDT: ${usdtAddress}`);

  // Deploy USDC (6 decimals, like real USDC)
  console.log("Deploying USDC mock...");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   USDC: ${usdcAddress}\n`);

  // Mint tokens to deployer for testing
  console.log("💰 Minting test tokens to deployer...\n");

  const mintAmount18 = ethers.parseEther("1000000"); // 1M tokens with 18 decimals
  const mintAmount6 = ethers.parseUnits("1000000", 6); // 1M tokens with 6 decimals

  await primaryToken.mint(deployer.address, mintAmount18);
  console.log(`   Minted 1,000,000 WETH to ${deployer.address}`);

  await usdt.mint(deployer.address, mintAmount6);
  console.log(`   Minted 1,000,000 USDT to ${deployer.address}`);

  await usdc.mint(deployer.address, mintAmount6);
  console.log(`   Minted 1,000,000 USDC to ${deployer.address}\n`);

  // Save token addresses
  const tokenInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    primaryToken: primaryAddress,
    usdtToken: usdtAddress,
    usdcToken: usdcAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save token info
  const tokenFile = path.join(deploymentsDir, `tokens-${networkName}.json`);
  fs.writeFileSync(tokenFile, JSON.stringify(tokenInfo, null, 2));
  console.log(`📁 Token info saved to: ${tokenFile}\n`);

  console.log("✅ Mock Token Deployment Complete!\n");
  console.log("========================================");
  console.log("   📌 Token Addresses for InheritX");
  console.log("========================================\n");
  console.log(`Update your deploy.ts config with these addresses:\n`);
  console.log(`primaryToken: "${primaryAddress}",`);
  console.log(`usdtToken: "${usdtAddress}",`);
  console.log(`usdcToken: "${usdcAddress}",\n`);

  return {
    primaryToken: primaryAddress,
    usdtToken: usdtAddress,
    usdcToken: usdcAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

