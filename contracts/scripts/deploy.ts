/// <reference types="node" />
// @ts-ignore - Hardhat is installed in client/node_modules, available at runtime
import { ethers, upgrades, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * InheritX Complete Deployment Script
 * 
 * This script handles:
 * 1. Deploying mock ERC20 tokens (if needed)
 * 2. Deploying InheritX UUPS upgradeable contract
 * 3. Verifying contracts on Blockscout/Etherscan
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network <network-name>
 * 
 * Examples:
 *   npx hardhat run scripts/deploy.ts --network liskSepolia
 *   npx hardhat run scripts/deploy.ts --network sepolia
 *   npx hardhat run scripts/deploy.ts --network localhost
 * 
 * Environment Variables:
 *   - PRIVATE_KEY: Deployer wallet private key
 *   - PRIMARY_TOKEN_ADDRESS: Primary token address (optional, will deploy mock if not provided)
 *   - USDT_TOKEN_ADDRESS: USDT token address (optional, will deploy mock if not provided)
 *   - USDC_TOKEN_ADDRESS: USDC token address (optional, will deploy mock if not provided)
 *   - ADMIN_ADDRESS: Admin address (defaults to deployer)
 *   - SKIP_VERIFICATION: Set to "true" to skip contract verification
 *   - SKIP_MOCK_TOKENS: Set to "true" to skip mock token deployment
 */

interface TokenAddresses {
  primaryToken: string;
  usdtToken: string;
  usdcToken: string;
}

interface DeploymentInfo {
  network: string;
  chainId: number;
  proxyAddress: string;
  implementationAddress: string;
  deployer: string;
  admin: string;
  tokens: TokenAddresses;
  deployedAt: string;
  blockNumber: number;
  verified: boolean;
}

async function deployMockTokens(deployer: ethers.Signer): Promise<TokenAddresses> {
  console.log("\n📦 Deploying Mock ERC20 Tokens...\n");

  const MockERC20 = await ethers.getContractFactory("MockERC20");

  // Deploy Primary Token (18 decimals)
  console.log("   Deploying Primary Token (WETH mock)...");
  const primaryToken = await MockERC20.deploy("Wrapped ETH", "WETH", 18);
  await primaryToken.waitForDeployment();
  const primaryAddress = await primaryToken.getAddress();
  console.log(`   ✅ Primary Token: ${primaryAddress}`);

  // Deploy USDT (6 decimals)
  console.log("   Deploying USDT mock...");
  const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(`   ✅ USDT: ${usdtAddress}`);

  // Deploy USDC (6 decimals)
  console.log("   Deploying USDC mock...");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   ✅ USDC: ${usdcAddress}\n`);

  // Mint tokens to deployer for testing
  console.log("   💰 Minting test tokens to deployer...");
  const mintAmount18 = ethers.parseEther("1000000");
  const mintAmount6 = ethers.parseUnits("1000000", 6);

  await primaryToken.mint(await deployer.getAddress(), mintAmount18);
  await usdt.mint(await deployer.getAddress(), mintAmount6);
  await usdc.mint(await deployer.getAddress(), mintAmount6);
  console.log("   ✅ Tokens minted\n");

  return {
    primaryToken: primaryAddress,
    usdtToken: usdtAddress,
    usdcToken: usdcAddress,
  };
}

async function verifyContract(
  address: string,
  constructorArguments: any[] = [],
  contractName: string = "InheritX"
): Promise<boolean> {
  try {
    console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
    console.log(`   ✅ ${contractName} verified successfully\n`);
    return true;
  } catch (error: any) {
    if (error.message?.includes("Already Verified")) {
      console.log(`   ✅ ${contractName} already verified\n`);
      return true;
    }
    console.log(`   ⚠️  Verification failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log("\n========================================");
  console.log("   InheritX Complete Deployment");
  console.log("========================================\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log(`📡 Network: ${networkName} (Chain ID: ${network.chainId})\n`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n && networkName !== "localhost" && networkName !== "hardhat") {
    throw new Error("Deployer has no ETH balance! Please fund your wallet.");
  }

  // Load or deploy tokens
  let tokenAddresses: TokenAddresses;
  const skipMockTokens = process.env.SKIP_MOCK_TOKENS === "true";
  const primaryTokenEnv = process.env.PRIMARY_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_TOKEN1_ADDRESS;
  const usdtTokenEnv = process.env.USDT_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_TOKEN2_ADDRESS;
  const usdcTokenEnv = process.env.USDC_TOKEN_ADDRESS || process.env.NEXT_PUBLIC_TOKEN3_ADDRESS;

  // Check if we have token addresses from previous deployments
  // Scripts are in contracts/scripts/, deployments folder is in contracts/
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const tokenFile = path.join(deploymentsDir, `tokens-${networkName}.json`);

  if (primaryTokenEnv && usdtTokenEnv && usdcTokenEnv) {
    // Use provided token addresses
    console.log("📋 Using provided token addresses from environment\n");
    tokenAddresses = {
      primaryToken: primaryTokenEnv,
      usdtToken: usdtTokenEnv,
      usdcToken: usdcTokenEnv,
    };
  } else if (fs.existsSync(tokenFile)) {
    // Load from previous deployment
    const tokenInfo = JSON.parse(fs.readFileSync(tokenFile, "utf-8"));
    console.log("📋 Loading token addresses from previous deployment\n");
    tokenAddresses = {
      primaryToken: tokenInfo.primaryToken,
      usdtToken: tokenInfo.usdtToken,
      usdcToken: tokenInfo.usdcToken,
    };
  } else if (!skipMockTokens) {
    // Deploy new mock tokens
    tokenAddresses = await deployMockTokens(deployer);

    // Save token addresses
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    const tokenInfo = {
      network: networkName,
      chainId: Number(network.chainId),
      ...tokenAddresses,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
    };
    fs.writeFileSync(tokenFile, JSON.stringify(tokenInfo, null, 2));
    console.log(`📁 Token addresses saved to: ${tokenFile}\n`);

    // Verify mock tokens if not localhost
    if (networkName !== "localhost" && networkName !== "hardhat" && process.env.SKIP_VERIFICATION !== "true") {
      await verifyContract(tokenAddresses.primaryToken, ["Wrapped ETH", "WETH", 18], "MockERC20 (Primary)");
      await verifyContract(tokenAddresses.usdtToken, ["Tether USD", "USDT", 6], "MockERC20 (USDT)");
      await verifyContract(tokenAddresses.usdcToken, ["USD Coin", "USDC", 6], "MockERC20 (USDC)");
    }
  } else {
    throw new Error("Token addresses are required! Set PRIMARY_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS, and USDC_TOKEN_ADDRESS, or set SKIP_MOCK_TOKENS=false");
  }

  // Validate token addresses
  if (!tokenAddresses.primaryToken || tokenAddresses.primaryToken === "0x0000000000000000000000000000000000000000") {
    throw new Error("Primary token address is required");
  }
  if (!tokenAddresses.usdtToken || tokenAddresses.usdtToken === "0x0000000000000000000000000000000000000000") {
    throw new Error("USDT token address is required");
  }
  if (!tokenAddresses.usdcToken || tokenAddresses.usdcToken === "0x0000000000000000000000000000000000000000") {
    throw new Error("USDC token address is required");
  }

  const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;

  console.log("📋 Deployment Configuration:");
  console.log(`   Admin: ${adminAddress}`);
  console.log(`   Primary Token: ${tokenAddresses.primaryToken}`);
  console.log(`   USDT Token: ${tokenAddresses.usdtToken}`);
  console.log(`   USDC Token: ${tokenAddresses.usdcToken}\n`);

  // Deploy InheritX contract
  console.log("🚀 Deploying InheritX contract...\n");

  const InheritX = await ethers.getContractFactory("InheritX");

  console.log("   Deploying implementation contract...");
  const inheritX = await upgrades.deployProxy(
    InheritX,
    [
      adminAddress,
      tokenAddresses.primaryToken,
      tokenAddresses.usdtToken,
      tokenAddresses.usdcToken,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  console.log("   Waiting for deployment confirmation...");
  await inheritX.waitForDeployment();

  const proxyAddress = await inheritX.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("\n✅ Deployment Successful!\n");
  console.log("📝 Contract Addresses:");
  console.log(`   Proxy Address: ${proxyAddress}`);
  console.log(`   Implementation Address: ${implementationAddress}\n`);

  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const adminRole = await inheritX.ADMIN_ROLE();
  const hasAdminRole = await inheritX.hasRole(adminRole, adminAddress);
  const primaryTokenAddress = await inheritX.primaryToken();
  const usdtTokenAddress = await inheritX.usdtToken();
  const usdcTokenAddress = await inheritX.usdcToken();

  console.log(`   Admin has ADMIN_ROLE: ${hasAdminRole}`);
  console.log(`   Primary Token: ${primaryTokenAddress}`);
  console.log(`   USDT Token: ${usdtTokenAddress}`);
  console.log(`   USDC Token: ${usdcTokenAddress}\n`);

  if (!hasAdminRole) {
    throw new Error("Admin role not set correctly!");
  }

  // Verify contracts
  let verified = false;
  if (networkName !== "localhost" && networkName !== "hardhat" && process.env.SKIP_VERIFICATION !== "true") {
    console.log("🔍 Verifying contracts on explorer...\n");
    
    // Verify implementation contract
    // For UUPS proxies, we verify the implementation, not the proxy
    verified = await verifyContract(implementationAddress);
    
    if (verified) {
      console.log("✅ All contracts verified successfully!\n");
    }
  } else {
    console.log("⏭️  Skipping verification (localhost/hardhat or SKIP_VERIFICATION=true)\n");
  }

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    proxyAddress,
    implementationAddress,
    deployer: deployer.address,
    admin: adminAddress,
    tokens: tokenAddresses,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    verified,
  };

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${deploymentFile}\n`);

  // Display important information
  console.log("========================================");
  console.log("   📌 IMPORTANT: Update Your .env File");
  console.log("========================================\n");
  console.log("Add these to your .env.local file:\n");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${proxyAddress}`);
  console.log(`NEXT_PUBLIC_TOKEN1_ADDRESS=${tokenAddresses.primaryToken}`);
  console.log(`NEXT_PUBLIC_TOKEN2_ADDRESS=${tokenAddresses.usdtToken}`);
  console.log(`NEXT_PUBLIC_TOKEN3_ADDRESS=${tokenAddresses.usdcToken}\n`);

  // Display explorer links
  const explorerUrls: Record<string, string> = {
    liskSepolia: "https://sepolia-blockscout.lisk.com",
    sepolia: "https://sepolia.etherscan.io",
    mainnet: "https://etherscan.io",
  };

  const explorerUrl = explorerUrls[networkName] || "https://blockscout.com";
  
  console.log("========================================");
  console.log("   🔗 Explorer Links");
  console.log("========================================\n");
  console.log(`Proxy: ${explorerUrl}/address/${proxyAddress}`);
  console.log(`Implementation: ${explorerUrl}/address/${implementationAddress}\n`);

  return {
    proxyAddress,
    implementationAddress,
    tokens: tokenAddresses,
    verified,
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
