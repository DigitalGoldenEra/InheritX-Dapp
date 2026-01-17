const { ethers, JsonRpcProvider, Contract } = require('ethers');

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia-api.lisk.com';
const CONTRACT_ADDRESS = '0x0FA905659BaFe6FC8f57862Fe52eDEd8587Bc74A';
const WALLET_ADDRESS = '0x4FF814ca633fcf989359a65bc152a2FcD740b807';

// ABI for roles
const ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "function ADMIN_ROLE() view returns (bytes32)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);

  console.log(`Checking roles for ${WALLET_ADDRESS} on ${CONTRACT_ADDRESS}`);

  try {
      try {
        const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
        const hasDefaultAdmin = await contract.hasRole(defaultAdminRole, WALLET_ADDRESS);
        console.log(`DEFAULT_ADMIN_ROLE (${defaultAdminRole}): ${hasDefaultAdmin}`);
      } catch (e) { console.log("DEFAULT_ADMIN_ROLE error: " + e.message); }

      try {
        const operatorRole = await contract.OPERATOR_ROLE();
        const hasOperator = await contract.hasRole(operatorRole, WALLET_ADDRESS);
        console.log(`OPERATOR_ROLE (${operatorRole}): ${hasOperator}`);
      } catch (e) { console.log("OPERATOR_ROLE error: " + e.message); }

      try {
        const adminRole = await contract.ADMIN_ROLE();
        const hasAdmin = await contract.hasRole(adminRole, WALLET_ADDRESS);
        console.log(`ADMIN_ROLE (${adminRole}): ${hasAdmin}`);
      } catch (e) { console.log("ADMIN_ROLE error: " + e.message); }

  } catch (error) {
      console.error("Error:", error.message);
  }
}

main();
