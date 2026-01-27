const ethers = require('ethers');

const candidates = [
"AccessControlBadConfirmation()",
"AccessControlUnauthorizedAccount(address,bytes32)",
"AddressEmptyCode(address)",
"AlreadyClaimed()",
"ERC1967InvalidImplementation(address)",
"ERC1967NonPayable()",
"EnforcedPause()",
"ExpectedPause()",
"FailedCall()",
"InsufficientAllowance(uint256,uint256)",
"InsufficientUserBalance(address,uint256,uint256)",
"InvalidAssetType(uint8)",
"InvalidBeneficiaries()",
"InvalidBeneficiaryData()",
"InvalidClaimCode()",
"InvalidInitialization()",
"InvalidInput()",
"InvalidPercentage(uint256)",
"InvalidState()",
"KYCAlreadySubmitted()",
"KYCNotApproved()",
"MaxBeneficiariesReached(uint256)",
"NotInitializing()",
"PercentageMustEqual100(uint256)",
"PlanNotActive(uint256)",
"PlanNotClaimable()",
"PlanNotFound(uint256)",
"ReentrancyGuardReentrantCall()",
"SafeERC20FailedOperation(address)",
"TransferDateNotReached()",
"UUPSUnauthorizedCallContext()",
"UUPSUnsupportedProxiableUUID(bytes32)",
"Unauthorized()",
"ZeroAddress()"
];

console.log("Checking for 0x342569d8...");
candidates.forEach(sig => {
    const hash = ethers.id(sig).slice(0, 10);
    if (hash === '0x342569d8') {
        console.log(`MATCH FOUND: ${sig} -> ${hash}`);
    } else {
        // console.log(`${sig} -> ${hash}`);
    }
});
