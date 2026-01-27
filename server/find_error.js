const ethers = require('ethers');
const abi = [
  "error AccessControlBadConfirmation()",
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error AddressEmptyCode(address target)",
  "error AlreadyClaimed()",
  "error ERC1967InvalidImplementation(address implementation)",
  "error ERC1967NonPayable()",
  "error EnforcedPause()",
  "error ExpectedPause()",
  "error FailedCall()",
  "error InsufficientAllowance(uint256 required, uint256 allowance)",
  "error InsufficientUserBalance(address user, uint256 required, uint256 available)",
  "error InvalidAssetType(uint8 assetType)",
  "error InvalidBeneficiaries()",
  "error InvalidBeneficiaryData()",
  "error InvalidClaimCode()",
  "error InvalidInitialization()",
  "error InvalidInput()",
  "error InvalidPercentage(uint256 percentage)",
  "error InvalidState()",
  "error KYCAlreadySubmitted()",
  "error KYCNotApproved()",
  "error MaxBeneficiariesReached(uint256 max)",
  "error NotInitializing()",
  "error PercentageMustEqual100(uint256 total)",
  "error PlanNotActive(uint256 planId)",
  "error PlanNotClaimable()",
  "error PlanNotFound(uint256 planId)",
  "error ReentrancyGuardReentrantCall()",
  "error SafeERC20FailedOperation(address token)",
  "error TransferDateNotReached()",
  "error UUPSUnauthorizedCallContext()",
  "error UUPSUnsupportedProxiableUUID(bytes32 slot)",
  "error Unauthorized()",
  "error ZeroAddress()"
];

const iface = new ethers.Interface(abi);
abi.forEach(item => {
    try {
        const signature = item.replace('error ', '');
        const id = ethers.id(signature).slice(0, 10);
        if (id === '0x342569d8') {
             console.log(`MATCH FOUND: ${signature} -> ${id}`);
        } else {
             // console.log(`${signature} -> ${id}`);
        }
    } catch (e) { console.error(e); }
});

// Also check manually built signatures just in case text parsing is off
const errors = [
    "AccessControlUnauthorizedAccount(address,bytes32)",
    "OwnableUnauthorizedAccount(address)"
];
errors.forEach(err => {
    const id = ethers.keccak256(ethers.toUtf8Bytes(err)).slice(0, 10);
    if (id === '0x342569d8') {
         console.log(`MATCH FOUND (Standard): ${err} -> ${id}`);
    }
});

