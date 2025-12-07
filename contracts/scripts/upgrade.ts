/// <reference types="node" />
// @ts-ignore - Hardhat is installed in client/node_modules, available at runtime
import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * InheritX Contract Upgrade Script
 * 
 * This script upgrades the InheritX UUPS proxy to a new implementation.
 * 
 * Usage:
 *   npx hardhat run contracts/scripts/upgrade.ts --network <network-name>
 * 
 * Note: Make sure the deployment info exists in ./deployments/<network>.json
 */

async function main() {
  console.log("\n========================================");
  console.log("   InheritX Contract Upgrade");
  console.log("========================================\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log(`📡 Network: ${networkName} (Chain ID: ${network.chainId})`);

  // Get upgrader account
  const [upgrader] = await ethers.getSigners();
  console.log(`👤 Upgrader: ${upgrader.address}\n`);

  // Load existing deployment info
  // Scripts are in contracts/scripts/, deployments folder is in contracts/
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment info not found for network: ${networkName}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const proxyAddress = deploymentInfo.proxyAddress;

  console.log(`📋 Current Deployment:`);
  console.log(`   Proxy Address: ${proxyAddress}`);
  console.log(`   Old Implementation: ${deploymentInfo.implementationAddress}\n`);

  // Deploy new implementation
  console.log("🚀 Upgrading InheritX contract...\n");

  const InheritX = await ethers.getContractFactory("InheritX");

  // Upgrade the proxy to new implementation
  const upgraded = await upgrades.upgradeProxy(proxyAddress, InheritX, {
    kind: "uups",
  });

  await upgraded.waitForDeployment();

  const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Upgrade Successful!\n");
  console.log("📝 Contract Addresses:");
  console.log(`   Proxy Address: ${proxyAddress} (unchanged)`);
  console.log(`   New Implementation: ${newImplementationAddress}\n`);

  // Update deployment info
  const updatedDeploymentInfo = {
    ...deploymentInfo,
    implementationAddress: newImplementationAddress,
    previousImplementations: [
      ...(deploymentInfo.previousImplementations || []),
      {
        address: deploymentInfo.implementationAddress,
        upgradedAt: deploymentInfo.deployedAt,
      },
    ],
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(updatedDeploymentInfo, null, 2));
  console.log(`📁 Deployment info updated: ${deploymentFile}\n`);

  // Verification instructions
  console.log("========================================");
  console.log("   🔍 Contract Verification");
  console.log("========================================\n");
  console.log("To verify the new implementation on Etherscan/Blockscout, run:\n");
  console.log(`npx hardhat verify --network ${networkName} ${newImplementationAddress}\n`);

  return {
    proxyAddress,
    newImplementationAddress,
  };
}

// Execute upgrade
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Upgrade failed:");
    console.error(error);
    process.exit(1);
  });

