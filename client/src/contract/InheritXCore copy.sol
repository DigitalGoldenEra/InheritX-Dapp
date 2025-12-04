// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

enum AssetType {
    ERC20_TOKEN1,
    ERC20_TOKEN2,
    ERC20_TOKEN3,
    NFT
}

enum PlanStatus {
    Active,
    Executed,
    Cancelled,
    Overridden,
    Paused,
    Expired,
    AssetsLocked,
    AssetsReleased
}

enum DistributionMethod {
    LumpSum,
    Quarterly,
    Yearly,
    Monthly
}

enum DisbursementStatus {
    Pending,
    Active,
    Paused,
    Completed,
    Cancelled
}

enum WithdrawalType {
    All,
    Partial,
    Emergency
}

enum WithdrawalStatus {
    Requested,
    Approved,
    Rejected,
    Processed,
    Cancelled
}

enum SwapStatus {
    Pending,
    Executed,
    Failed,
    Cancelled
}

struct InheritancePlan {
    uint256 id;
    address owner;
    uint8 beneficiaryCount;
    AssetType assetType;
    uint256 assetAmount;
    uint256 nftTokenId;
    address nftContract;
    uint64 timeframe;
    uint64 createdAt;
    uint64 becomesActiveAt;
    address guardian;
    string encryptedDetails;
    PlanStatus status;
    bool isClaimed;
    bytes32 claimCodeHash;
    uint64 inactivityThreshold;
    uint64 lastActivity;
    uint256 swapRequestId;
    uint256 escrowId;
    uint8 securityLevel;
    bool autoExecute;
    uint8 emergencyContactsCount;
}

struct Beneficiary {
    address beneficiaryAddress;
    string name;
    string email;
    string relationship;
    bytes32 claimCodeHash;
    bool hasClaimed;
    uint256 claimedAmount;
}

struct BeneficiaryInput {
    string name;
    string email;
    string relationship;
}

struct EscrowAccount {
    uint256 id;
    uint256 planId;
    AssetType assetType;
    uint256 amount;
    uint256 nftTokenId;
    address nftContract;
    bool isLocked;
    uint64 lockedAt;
    address beneficiary;
    uint8 releaseConditionsCount;
    uint256 fees;
    uint256 taxLiability;
    uint64 lastValuation;
    uint256 valuationPrice;
}

struct DistributionPlan {
    uint256 planId;
    address owner;
    uint256 totalAmount;
    DistributionMethod distributionMethod;
    uint256 periodAmount;
    uint64 startDate;
    uint64 endDate;
    uint8 totalPeriods;
    uint8 completedPeriods;
    uint64 nextDisbursementDate;
    bool isActive;
    uint8 beneficiariesCount;
    DisbursementStatus disbursementStatus;
    uint64 createdAt;
    uint64 lastActivity;
    uint64 pausedAt;
    uint64 resumedAt;
}

struct DistributionConfig {
    DistributionMethod distributionMethod;
    uint64 lumpSumDate;
    uint8 quarterlyPercentage;
    uint8 yearlyPercentage;
    uint8 monthlyPercentage;
    string additionalNote;
    uint64 startDate;
    uint64 endDate;
}

struct SecuritySettings {
    uint8 maxBeneficiaries;
    uint64 minTimeframe;
    uint64 maxTimeframe;
    bool requireGuardian;
    bool allowEarlyExecution;
    uint256 maxAssetAmount;
    bool requireMultiSig;
    uint8 multiSigThreshold;
    uint64 emergencyTimeout;
}

struct FeeConfig {
    uint256 feePercentage;
    address feeRecipient;
    bool isActive;
    uint256 minFee;
    uint256 maxFee;
}

struct WithdrawalRequest {
    uint256 requestId;
    uint256 planId;
    address beneficiary;
    AssetType assetType;
    WithdrawalType withdrawalType;
    uint256 amount;
    uint256 nftTokenId;
    address nftContract;
    WithdrawalStatus status;
    uint64 requestedAt;
    uint64 processedAt;
    address processedBy;
    uint256 feesDeducted;
    uint256 netAmount;
}

struct FreezeInfo {
    string reason;
    uint64 frozenAt;
    address frozenBy;
}

struct SwapRequest {
    uint256 id;
    uint256 planId;
    address fromToken;
    address toToken;
    uint256 amount;
    uint256 slippageTolerance;
    SwapStatus status;
    uint64 createdAt;
    uint64 executedAt;
    uint256 executionPrice;
    uint256 gasUsed;
    string failedReason;
}

struct ClaimCode {
    bytes32 codeHash;
    uint256 planId;
    address beneficiary;
    bool isUsed;
    uint64 generatedAt;
    uint64 expiresAt;
    uint64 usedAt;
    uint8 attempts;
    bool isRevoked;
    uint64 revokedAt;
    address revokedBy;
}

error Unauthorized();
error ZeroAddress();
error InvalidInput();
error InvalidState();
error PlanNotFound(uint256 planId);
error PlanNotActive(uint256 planId);
error InvalidBeneficiaries();
error MaxBeneficiariesReached(uint256 max);
error InvalidPercentage(uint8 percentage);
error InvalidPercentageSum(uint8 sum);
error InvalidAssetType(uint8 assetType);
error InsufficientAllowance(uint256 required, uint256 allowance);
error InsufficientUserBalance(address user, uint256 required, uint256 available);
error TransferFailed();

/**
 * @title InheritXCore
 * @notice Core storage and configuration for the InheritX inheritance platform
 */
contract InheritXCore is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    uint256 public planCount;
    uint256 public escrowCount;

    address public dexRouter;
    address public emergencyWithdrawAddress;

    address public primaryToken;
    address public usdtToken;
    address public usdcToken;

    mapping(uint256 => InheritancePlan) public inheritancePlans;
    mapping(uint256 => EscrowAccount) public escrowAccounts;
    mapping(uint256 => uint256) public planEscrow;
    mapping(uint256 => uint256) public planBeneficiaryCount;
    mapping(uint256 => mapping(uint256 => Beneficiary)) public planBeneficiaries;
    mapping(uint256 => mapping(address => uint256)) public beneficiaryByAddress;
    mapping(address => uint256) public userPlanCount;

    SecuritySettings public securitySettings;
    FeeConfig public feeConfig;
    uint256 public totalFeesCollected;
    mapping(uint256 => uint256) public planFeesCollected;

    mapping(uint256 => WithdrawalRequest) public withdrawalRequests;
    uint256 public withdrawalRequestCount;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _dexRouter,
        address _emergencyWithdrawAddress,
        address _primaryToken,
        address _usdtToken,
        address _usdcToken
    ) public initializer {
        if (_admin == address(0)) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        dexRouter = _dexRouter;
        emergencyWithdrawAddress = _emergencyWithdrawAddress;
        primaryToken = _primaryToken;
        usdtToken = _usdtToken;
        usdcToken = _usdcToken;

        securitySettings = SecuritySettings({
            maxBeneficiaries: 10,
            minTimeframe: 1 days,
            maxTimeframe: 365 days,
            requireGuardian: false,
            allowEarlyExecution: false,
            maxAssetAmount: 1_000_000 ether,
            requireMultiSig: false,
            multiSigThreshold: 2,
            emergencyTimeout: 7 days
        });

        feeConfig = FeeConfig({
            feePercentage: 200,
            feeRecipient: _admin,
            isActive: true,
            minFee: 0.001 ether,
            maxFee: 100 ether
        });
    }

    event PlanCreated(
        uint256 indexed planId,
        address indexed owner,
        string planName,
        string planDescription,
        string beneficiaryName,
        string beneficiaryRelationship,
        string beneficiaryEmail,
        uint8 assetType,
        uint256 assetAmount,
        uint8 distributionMethod,
        uint64 createdAt
    );

    event FeeCollected(
        uint256 indexed planId,
        address indexed beneficiary,
        uint256 feeAmount,
        uint256 feePercentage,
        uint256 grossAmount,
        uint256 netAmount,
        address feeRecipient,
        uint64 collectedAt
    );

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _calculateFee(uint256 amount)
        internal
        view
        returns (uint256 feeAmount, uint256 netAmount)
    {
        if (!feeConfig.isActive) {
            return (0, amount);
        }

        if (amount > type(uint256).max / feeConfig.feePercentage) {
            revert InvalidInput();
        }

        uint256 feeNumerator = amount * feeConfig.feePercentage;
        feeAmount = feeNumerator / 10_000;

        if (feeAmount > amount) {
            feeAmount = amount;
        }

        if (feeAmount < feeConfig.minFee) {
            feeAmount = feeConfig.minFee;
        } else if (feeAmount > feeConfig.maxFee) {
            feeAmount = feeConfig.maxFee;
        }

        if (feeAmount > amount) {
            revert InvalidInput();
        }

        netAmount = amount - feeAmount;
    }

    function _validateBeneficiaryInputs(
        BeneficiaryInput[] calldata beneficiaries
    ) internal view {
        uint8 maxBeneficiaries = securitySettings.maxBeneficiaries;
        uint256 length = beneficiaries.length;

        if (length == 0) revert InvalidBeneficiaries();
        if (length > maxBeneficiaries) {
            revert MaxBeneficiariesReached(maxBeneficiaries);
        }

        for (uint256 i = 0; i < length; i++) {
            if (
                bytes(beneficiaries[i].name).length == 0 ||
                bytes(beneficiaries[i].email).length == 0 ||
                bytes(beneficiaries[i].relationship).length == 0
            ) {
                revert InvalidInput();
            }
        }
    }

    function _validateDistributionConfig(
        uint8 distributionMethod,
        uint64 lumpSumDate,
        uint8 quarterlyPercentage,
        uint8 yearlyPercentage,
        uint8 monthlyPercentage
    ) internal view {
        if (distributionMethod == uint8(DistributionMethod.LumpSum)) {
            if (lumpSumDate == 0 || lumpSumDate < block.timestamp) {
                revert InvalidInput();
            }
            if (
                quarterlyPercentage != 0 ||
                yearlyPercentage != 0 ||
                monthlyPercentage != 0
            ) {
                revert InvalidInput();
            }
        } else if (distributionMethod == uint8(DistributionMethod.Quarterly)) {
            if (quarterlyPercentage == 0 || quarterlyPercentage > 100) {
                revert InvalidPercentage(quarterlyPercentage);
            }
            if (lumpSumDate != 0) revert InvalidInput();
        } else if (distributionMethod == uint8(DistributionMethod.Yearly)) {
            if (yearlyPercentage == 0 || yearlyPercentage > 100) {
                revert InvalidPercentage(yearlyPercentage);
            }
            if (lumpSumDate != 0) revert InvalidInput();
        } else if (distributionMethod == uint8(DistributionMethod.Monthly)) {
            if (monthlyPercentage == 0 || monthlyPercentage > 100) {
                revert InvalidPercentage(monthlyPercentage);
            }
            if (lumpSumDate != 0) revert InvalidInput();
        } else {
            revert InvalidInput();
        }
    }

    function _getTokenAddress(uint8 assetType) internal view returns (address) {
        if (assetType == uint8(AssetType.ERC20_TOKEN1)) {
            return primaryToken;
        } else if (assetType == uint8(AssetType.ERC20_TOKEN2)) {
            return usdtToken;
        } else if (assetType == uint8(AssetType.ERC20_TOKEN3)) {
            return usdcToken;
        }

        revert InvalidAssetType(assetType);
    }
}

