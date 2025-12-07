import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Hardhat Configuration for InheritX Contract Deployment
 * 
 * Environment Variables Required:
 * - PRIVATE_KEY: Deployer wallet private key
 * - SEPOLIA_RPC_URL: Sepolia testnet RPC URL
 * - MAINNET_RPC_URL: Ethereum mainnet RPC URL
 * - ETHERSCAN_API_KEY: Etherscan API key for verification
 * - LISK_SEPOLIA_RPC_URL: Lisk Sepolia testnet RPC URL
 */

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key";
const LISK_SEPOLIA_RPC_URL = process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compilation for complex contracts
      evmVersion: "cancun", // Required for OpenZeppelin v5
    },
    // Only compile files in the contracts directory, not node_modules
    overrides: {},
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Ethereum Sepolia Testnet
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    // Ethereum Mainnet
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1,
    },
    // Lisk Sepolia Testnet
    liskSepolia: {
      url: LISK_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 4202,
      gasPrice: 1000000000, // 1 gwei
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      liskSepolia: "placeholder", // Lisk uses Blockscout, may need different config
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
