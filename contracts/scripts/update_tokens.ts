/// <reference types="node" />
// @ts-ignore - Hardhat is installed in client/node_modules, available at runtime
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const proxyAddress = "0x7D335d06F3F002623850E108Ba4A9F025d8468e7"; // Fallback to known address
    // Lisk Mainnet WETH
    const LISK_WETH = "0x4200000000000000000000000000000000000006";

    // Current addresses (PRESERVE THESE)
    const USDT_ADDRESS = "0x05D032ac25d322df992303dCa074EE7392C117b9";
    const USDC_ADDRESS = "0x680e8ECB908A2040232ef139A0A52cbE47b9F15B";

    console.log(`Connecting to InheritX at ${proxyAddress}...`);
    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    const InheritX = await ethers.getContractAt("InheritX", proxyAddress);

    const ADMIN_ROLE = await InheritX.ADMIN_ROLE();
    const hasRole = await InheritX.hasRole(ADMIN_ROLE, signer.address);
    console.log(`Signer has ADMIN_ROLE: ${hasRole}`);

    if (!hasRole) {
        console.error("❌ Signer does not have ADMIN_ROLE. Cannot update tokens.");
        return;
    }

    console.log(`Updating primary token to Lisk WETH: ${LISK_WETH}`);

    // Custom gas limit to avoid estimation errors if it's edge case
    const tx = await InheritX.updateTokenAddresses(
        LISK_WETH,
        USDT_ADDRESS,
        USDC_ADDRESS
        // { gasLimit: 500000 }
    );

    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();

    console.log("Tokens updated successfully!");
    console.log(`Primary Token: ${await InheritX.primaryToken()}`);
    console.log(`USDT Token: ${await InheritX.usdtToken()}`);
    console.log(`USDC Token: ${await InheritX.usdcToken()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
