// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title InheritX - Secure Digital Inheritance Platform
 * @author InheritX Team
 * @notice A decentralized inheritance platform built on Lisk for managing digital asset inheritance
 * @dev This contract implements:
 *      - Plan creation with ERC20 tokens
 *      - Hashed beneficiary information for privacy (keccak256)
 *      - Hashed claim codes for secure claiming
 *      - Distribution methods (LumpSum, Quarterly, Yearly, Monthly)
 *      - KYC verification requirement before plan creation
 *      - Escrow management and fee collection
 * 
 * SECURITY NOTES:
 * - Beneficiary info (name, email, relationship) is hashed before storing
 * - Claim codes are hashed before storing
 * - Original data is stored off-chain in the backend
 * - Claimers must provide matching data that hashes to stored values
 */

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ============================================
// ENUMS
// ============================================

/**
 * @notice Supported asset types in the platform
 */
enum AssetType {
    ERC20_TOKEN1,   // Primary token (e.g., wrapped ETH)
    ERC20_TOKEN2,   // USDT
    ERC20_TOKEN3,   // USDC
    NFT             // Reserved for future NFT support
}

/**
 * @notice Status states for inheritance plans
 */
enum PlanStatus {
    Active,         // Plan is active and can be modified
    Executed,       // Plan has been fully executed/claimed
    Cancelled,      // Plan was cancelled by owner
    Overridden,     // Plan was overridden by new plan
    Paused,         // Plan is temporarily paused
    Expired,        // Plan has expired
    AssetsLocked,   // Assets are locked pending claim
    AssetsReleased  // Assets have been released to beneficiaries
}

/**
 * @notice Distribution methods for inheritance funds
 */
enum DistributionMethod {
    LumpSum,    // Single distribution at specified date
    Quarterly,  // Distribution every 3 months
    Yearly,     // Distribution every year
    Monthly     // Distribution every month
}

/**
 * @notice Status of distribution/disbursement schedule
 */
enum DisbursementStatus {
    Pending,    // Not yet started
    Active,     // Currently disbursing
    Paused,     // Temporarily paused
    Completed,  // All disbursements complete
    Cancelled   // Disbursement cancelled
}

/**
 * @notice KYC verification status
 */
enum KYCStatus {
    NotSubmitted,   // No KYC submitted
    Pending,        // KYC submitted, awaiting review
    Approved,       // KYC approved
    Rejected        // KYC rejected
}

// ============================================
// STRUCTS
// ============================================

/**
 * @notice Core inheritance plan data structure
 * @dev All sensitive data is stored as keccak256 hashes
 */
struct InheritancePlan {
    uint256 id;                     // Unique plan identifier (global)
    address owner;                  // Address of plan creator
    uint8 beneficiaryCount;         // Number of beneficiaries
    AssetType assetType;            // Type of asset in the plan
    uint256 assetAmount;            // Total asset amount after fees
    uint64 createdAt;               // Plan creation timestamp
    uint64 transferDate;            // When assets can be transferred/claimed
    PlanStatus status;              // Current plan status
    bool isClaimed;                 // Whether plan has been claimed
    bytes32 claimCodeHash;          // Keccak256 hash of claim code
    uint256 escrowId;               // Associated escrow account ID
}

/**
 * @notice Beneficiary information - stored as hashes for privacy
 * @dev The actual data is stored in the backend, only hashes on-chain
 */
struct Beneficiary {
    bytes32 nameHash;               // Keccak256 hash of beneficiary name
    bytes32 emailHash;              // Keccak256 hash of beneficiary email
    bytes32 relationshipHash;       // Keccak256 hash of relationship to owner
    bytes32 beneficiaryDataHash;    // Combined hash of all beneficiary data
    address claimedBy;              // Address that claimed (set when claimed)
    bool hasClaimed;                // Whether beneficiary has claimed
    uint256 claimedAmount;          // Amount claimed so far
    uint256 allocatedPercentage;    // Percentage allocated to this beneficiary (basis points)
}

/**
 * @notice Input struct for creating beneficiaries with hashed data
 * @dev Frontend must hash the data before sending
 */
struct BeneficiaryInput {
    bytes32 nameHash;               // Keccak256 hash of name
    bytes32 emailHash;              // Keccak256 hash of email
    bytes32 relationshipHash;       // Keccak256 hash of relationship
    uint256 allocatedPercentage;    // Percentage in basis points (10000 = 100%)
}

/**
 * @notice Escrow account for holding plan assets
 */
struct EscrowAccount {
    uint256 id;                     // Unique escrow identifier
    uint256 planId;                 // Associated plan ID
    AssetType assetType;            // Type of asset held
    uint256 amount;                 // Amount held in escrow
    bool isLocked;                  // Whether funds are locked
    uint64 lockedAt;                // When funds were locked
    uint256 fees;                   // Fees deducted
}

/**
 * @notice Distribution plan for scheduled payouts
 */
struct DistributionPlan {
    uint256 planId;                     // Associated plan ID
    address owner;                      // Plan owner
    uint256 totalAmount;                // Total amount to distribute
    DistributionMethod distributionMethod;  // How to distribute
    uint256 periodAmount;               // Amount per period
    uint64 startDate;                   // When distribution starts
    uint64 endDate;                     // When distribution ends
    uint8 totalPeriods;                 // Total number of periods
    uint8 completedPeriods;             // Completed periods count
    uint64 nextDisbursementDate;        // Next scheduled distribution
    bool isActive;                      // Whether distribution is active
    DisbursementStatus disbursementStatus;  // Current status
    uint64 createdAt;                   // Creation timestamp
}

/**
 * @notice Distribution configuration
 */
struct DistributionConfig {
    DistributionMethod distributionMethod;  // Distribution type
    uint64 transferDate;                    // For lump sum: transfer date
    uint8 periodicPercentage;               // Percentage per period (for periodic)
    uint64 startDate;                       // Distribution start date
    uint64 endDate;                         // Distribution end date
}

/**
 * @notice User KYC information
 */
struct UserKYC {
    address userAddress;            // User's wallet address
    KYCStatus status;               // Current KYC status
    uint64 submittedAt;             // When KYC was submitted
    uint64 reviewedAt;              // When KYC was reviewed
    address reviewedBy;             // Admin who reviewed
    bytes32 kycDataHash;            // Hash of KYC data for verification
}

/**
 * @notice Fee configuration
 */
struct FeeConfig {
    uint256 feePercentage;          // In basis points (100 = 1%)
    address feeRecipient;           // Where fees go
    bool isActive;                  // Whether fees are active
    uint256 minFee;                 // Minimum fee amount
    uint256 maxFee;                 // Maximum fee amount
}

/**
 * @notice Mapping from global plan ID to user's local plan ID
 */
struct UserPlanMapping {
    address user;
    uint256 userPlanId;
}

// ============================================
// CUSTOM ERRORS
// ============================================

error Unauthorized();
error ZeroAddress();
error InvalidInput();
error InvalidState();
error PlanNotFound(uint256 planId);
error PlanNotActive(uint256 planId);
error InvalidBeneficiaries();
error MaxBeneficiariesReached(uint256 max);
error InvalidPercentage(uint256 percentage);
error PercentageMustEqual100(uint256 total);
error InvalidAssetType(uint8 assetType);
error InsufficientAllowance(uint256 required, uint256 allowance);
error InsufficientUserBalance(address user, uint256 required, uint256 available);
error TransferFailed();
error InvalidClaimCode();
error InvalidBeneficiaryData();
error AlreadyClaimed();
error PlanNotClaimable();
error TransferDateNotReached();
error KYCNotApproved();
error KYCAlreadySubmitted();
error KYCNotFound();

// ============================================
// EVENTS
// ============================================

/**
 * @notice Emitted when a new plan is created
 */
event PlanCreated(
    uint256 indexed globalPlanId,
    uint256 indexed userPlanId,
    address indexed owner,
    uint8 assetType,
    uint256 assetAmount,
    uint8 distributionMethod,
    uint64 transferDate,
    uint8 beneficiaryCount,
    uint64 createdAt
);

/**
 * @notice Emitted when fees are collected
 */
event FeeCollected(
    uint256 indexed planId,
    uint256 feeAmount,
    uint256 netAmount,
    address feeRecipient,
    uint64 collectedAt
);

/**
 * @notice Emitted when a beneficiary claims their inheritance
 */
event InheritanceClaimed(
    uint256 indexed planId,
    address indexed claimer,
    uint256 beneficiaryIndex,
    uint256 amount,
    uint64 claimedAt
);

/**
 * @notice Emitted when plan status changes
 */
event PlanStatusChanged(
    uint256 indexed planId,
    PlanStatus oldStatus,
    PlanStatus newStatus,
    uint64 changedAt
);

/**
 * @notice Emitted when KYC is submitted
 */
event KYCSubmitted(
    address indexed user,
    bytes32 kycDataHash,
    uint64 submittedAt
);

/**
 * @notice Emitted when KYC status changes
 */
event KYCStatusChanged(
    address indexed user,
    KYCStatus oldStatus,
    KYCStatus newStatus,
    address indexed reviewedBy,
    uint64 changedAt
);

/**
 * @notice Emitted for periodic distribution execution
 */
event DistributionExecuted(
    uint256 indexed planId,
    uint8 periodNumber,
    uint256 amount,
    uint64 executedAt
);

// ============================================
// MAIN CONTRACT
// ============================================

/**
 * @title InheritX
 * @notice Main contract for the InheritX digital inheritance platform
 * @dev Implements UUPS upgradeable pattern with access control and pausability
 */
contract InheritX is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // ============================================
    // CONSTANTS
    // ============================================

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    /// @notice Plan creation fee in basis points (5% = 500)
    uint256 public constant PLAN_CREATION_FEE_BPS = 500;
    
    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BPS_DENOMINATOR = 10_000;
    
    /// @notice Minimum claim code length
    uint256 private constant MIN_CLAIM_CODE_LENGTH = 6;
    
    /// @notice Maximum beneficiaries per plan
    uint8 private constant MAX_BENEFICIARIES = 10;

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice Total number of plans created
    uint256 public planCount;
    
    /// @notice Total number of escrow accounts
    uint256 public escrowCount;

    /// @notice Primary token address (e.g., wrapped ETH)
    address public primaryToken;
    
    /// @notice USDT token address
    address public usdtToken;
    
    /// @notice USDC token address
    address public usdcToken;

    /// @notice All inheritance plans by global ID
    mapping(uint256 => InheritancePlan) public inheritancePlans;
    
    /// @notice All escrow accounts by ID
    mapping(uint256 => EscrowAccount) public escrowAccounts;
    
    /// @notice Plan ID to escrow ID mapping
    mapping(uint256 => uint256) public planEscrow;
    
    /// @notice Beneficiary count per plan
    mapping(uint256 => uint256) public planBeneficiaryCount;
    
    /// @notice Beneficiaries per plan (planId => index => Beneficiary)
    mapping(uint256 => mapping(uint256 => Beneficiary)) public planBeneficiaries;
    
    /// @notice User's total plan count
    mapping(address => uint256) public userPlanCount;

    /// @notice Fee configuration
    FeeConfig public feeConfig;
    
    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    /// @notice Distribution plans by plan ID
    mapping(uint256 => DistributionPlan) public distributionPlans;
    
    /// @notice Distribution configs by plan ID
    mapping(uint256 => DistributionConfig) public distributionConfigs;

    /// @notice Plan names by plan ID (stored as hash for privacy)
    mapping(uint256 => bytes32) public planNameHashes;
    
    /// @notice Plan descriptions by plan ID (stored as hash for privacy)
    mapping(uint256 => bytes32) public planDescriptionHashes;

    /// @notice User's plan ID counter (local IDs per user)
    mapping(address => uint256) public userPlanIdCounter;
    
    /// @notice User's local plan ID to global plan ID
    mapping(address => mapping(uint256 => uint256)) public userPlanIdToGlobal;
    
    /// @notice Global plan ID to user mapping
    mapping(uint256 => UserPlanMapping) public globalPlanIdToUser;

    /// @notice User KYC data
    mapping(address => UserKYC) public userKYC;
    
    /// @notice Whether KYC is required for plan creation
    bool public kycRequired;

    // ============================================
    // MODIFIERS
    // ============================================

    /**
     * @notice Ensures caller is the plan owner
     */
    modifier onlyPlanOwner(uint256 planId) {
        if (inheritancePlans[planId].owner != msg.sender) {
            revert Unauthorized();
        }
        _;
    }

    /**
     * @notice Ensures plan exists
     */
    modifier planExists(uint256 planId) {
        if (planId == 0 || planId > planCount) {
            revert PlanNotFound(planId);
        }
        _;
    }

    /**
     * @notice Ensures user has approved KYC (if required)
     */
    modifier kycApproved() {
        if (kycRequired && userKYC[msg.sender].status != KYCStatus.Approved) {
            revert KYCNotApproved();
        }
        _;
    }

    // ============================================
    // CONSTRUCTOR & INITIALIZER
    // ============================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with required addresses
     * @param _admin Admin address with full control
     * @param _primaryToken Primary ERC20 token address
     * @param _usdtToken USDT token address
     * @param _usdcToken USDC token address
     */
    function initialize(
        address _admin,
        address _primaryToken,
        address _usdtToken,
        address _usdcToken
    ) public initializer {
        if (_admin == address(0)) revert ZeroAddress();

        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        primaryToken = _primaryToken;
        usdtToken = _usdtToken;
        usdcToken = _usdcToken;

        // Initialize fee configuration (2% service fee)
        feeConfig = FeeConfig({
            feePercentage: 200, // 2% in basis points
            feeRecipient: _admin,
            isActive: true,
            minFee: 0,
            maxFee: type(uint256).max
        });

        // KYC is required by default
        kycRequired = true;
    }

    // ============================================
    // KYC FUNCTIONS
    // ============================================

    /**
     * @notice Submit KYC data for verification
     * @param kycDataHash Hash of KYC data (name + email + ID document hash)
     * @dev Actual KYC data is stored off-chain, only hash stored on-chain
     */
    function submitKYC(bytes32 kycDataHash) external whenNotPaused {
        if (kycDataHash == bytes32(0)) revert InvalidInput();
        
        UserKYC storage kyc = userKYC[msg.sender];
        
        // Allow resubmission if rejected
        if (kyc.status == KYCStatus.Pending || kyc.status == KYCStatus.Approved) {
            revert KYCAlreadySubmitted();
        }

        kyc.userAddress = msg.sender;
        kyc.status = KYCStatus.Pending;
        kyc.submittedAt = uint64(block.timestamp);
        kyc.kycDataHash = kycDataHash;
        kyc.reviewedAt = 0;
        kyc.reviewedBy = address(0);

        emit KYCSubmitted(msg.sender, kycDataHash, uint64(block.timestamp));
    }

    /**
     * @notice Approve a user's KYC (admin only)
     * @param user Address of user to approve
     */
    function approveKYC(address user) external onlyRole(ADMIN_ROLE) {
        UserKYC storage kyc = userKYC[user];
        if (kyc.status != KYCStatus.Pending) revert KYCNotFound();

        KYCStatus oldStatus = kyc.status;
        kyc.status = KYCStatus.Approved;
        kyc.reviewedAt = uint64(block.timestamp);
        kyc.reviewedBy = msg.sender;

        emit KYCStatusChanged(user, oldStatus, KYCStatus.Approved, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Reject a user's KYC (admin only)
     * @param user Address of user to reject
     */
    function rejectKYC(address user) external onlyRole(ADMIN_ROLE) {
        UserKYC storage kyc = userKYC[user];
        if (kyc.status != KYCStatus.Pending) revert KYCNotFound();

        KYCStatus oldStatus = kyc.status;
        kyc.status = KYCStatus.Rejected;
        kyc.reviewedAt = uint64(block.timestamp);
        kyc.reviewedBy = msg.sender;

        emit KYCStatusChanged(user, oldStatus, KYCStatus.Rejected, msg.sender, uint64(block.timestamp));
    }

    /**
     * @notice Check if a user is KYC verified
     * @param user Address to check
     * @return Whether user is KYC approved
     */
    function isKYCApproved(address user) external view returns (bool) {
        return userKYC[user].status == KYCStatus.Approved;
    }

    /**
     * @notice Get user's KYC status
     * @param user Address to check
     * @return KYC status enum value
     */
    function getKYCStatus(address user) external view returns (KYCStatus) {
        return userKYC[user].status;
    }

    /**
     * @notice Toggle KYC requirement (admin only)
     * @param required Whether KYC is required
     */
    function setKYCRequired(bool required) external onlyRole(ADMIN_ROLE) {
        kycRequired = required;
    }

    // ============================================
    // PLAN CREATION
    // ============================================

    /**
     * @notice Creates a new inheritance plan with hashed beneficiary data
     * @dev All sensitive data (names, emails, relationships) must be hashed before calling
     * @param planNameHash Keccak256 hash of plan name
     * @param planDescriptionHash Keccak256 hash of plan description
     * @param beneficiaries Array of beneficiary hashed data
     * @param assetType Type of asset (ERC20_TOKEN1, ERC20_TOKEN2, ERC20_TOKEN3)
     * @param assetAmount Amount of tokens to lock in the plan
     * @param distributionMethod How assets will be distributed
     * @param transferDate Date for asset transfer (timestamp)
     * @param periodicPercentage Percentage per period (for non-lump sum)
     * @param claimCodeHash Keccak256 hash of the claim code
     * @return userPlanId The user's local plan ID
     */
    function createInheritancePlan(
        bytes32 planNameHash,
        bytes32 planDescriptionHash,
        BeneficiaryInput[] calldata beneficiaries,
        uint8 assetType,
        uint256 assetAmount,
        uint8 distributionMethod,
        uint64 transferDate,
        uint8 periodicPercentage,
        bytes32 claimCodeHash
    ) external whenNotPaused nonReentrant kycApproved returns (uint256) {
        // Input validation
        if (planNameHash == bytes32(0)) revert InvalidInput();
        if (planDescriptionHash == bytes32(0)) revert InvalidInput();
        if (claimCodeHash == bytes32(0)) revert InvalidInput();
        if (assetAmount == 0) revert InvalidInput();
        if (transferDate <= block.timestamp) revert InvalidInput();

        // Validate beneficiaries
        _validateBeneficiaryInputs(beneficiaries);

        // Validate distribution method
        _validateDistributionMethod(distributionMethod, periodicPercentage);

        // Get token address and validate
        address tokenAddress = _getTokenAddress(assetType);
        IERC20 token = IERC20(tokenAddress);

        // Calculate fees
        uint256 creationFee = _calculatePlanCreationFee(assetAmount);
        uint256 totalRequired = assetAmount + creationFee;

        // Verify allowance and balance
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < totalRequired) {
            revert InsufficientAllowance(totalRequired, allowance);
        }

        uint256 balance = token.balanceOf(msg.sender);
        if (balance < totalRequired) {
            revert InsufficientUserBalance(msg.sender, totalRequired, balance);
        }

        // Calculate service fee
        (uint256 serviceFee, uint256 netAmount) = _calculateFee(assetAmount);
        if (netAmount == 0) revert InvalidInput();

        // Transfer tokens to contract
        token.safeTransferFrom(msg.sender, address(this), totalRequired);

        // Transfer fees to recipient
        uint256 totalFees = creationFee + serviceFee;
        if (totalFees > 0 && feeConfig.feeRecipient != address(0)) {
            token.safeTransfer(feeConfig.feeRecipient, totalFees);
        }

        // Create plan IDs
        uint256 globalPlanId = ++planCount;
        uint256 userPlanId = ++userPlanIdCounter[msg.sender];
        uint256 escrowId = ++escrowCount;

        // Map user plan ID to global plan ID
        userPlanIdToGlobal[msg.sender][userPlanId] = globalPlanId;
        globalPlanIdToUser[globalPlanId] = UserPlanMapping({
            user: msg.sender,
            userPlanId: userPlanId
        });

        // Store the inheritance plan
        inheritancePlans[globalPlanId] = InheritancePlan({
            id: globalPlanId,
            owner: msg.sender,
            beneficiaryCount: uint8(beneficiaries.length),
            assetType: AssetType(assetType),
            assetAmount: netAmount,
            createdAt: uint64(block.timestamp),
            transferDate: transferDate,
            status: PlanStatus.Active,
            isClaimed: false,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });

        // Store plan name and description hashes
        planNameHashes[globalPlanId] = planNameHash;
        planDescriptionHashes[globalPlanId] = planDescriptionHash;

        // Store beneficiaries with hashed data
        planBeneficiaryCount[globalPlanId] = beneficiaries.length;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 beneficiaryIndex = i + 1; // 1-indexed
            
            // Create combined hash for verification
            bytes32 beneficiaryDataHash = keccak256(abi.encodePacked(
                beneficiaries[i].nameHash,
                beneficiaries[i].emailHash,
                beneficiaries[i].relationshipHash
            ));

            planBeneficiaries[globalPlanId][beneficiaryIndex] = Beneficiary({
                nameHash: beneficiaries[i].nameHash,
                emailHash: beneficiaries[i].emailHash,
                relationshipHash: beneficiaries[i].relationshipHash,
                beneficiaryDataHash: beneficiaryDataHash,
                claimedBy: address(0),
                hasClaimed: false,
                claimedAmount: 0,
                allocatedPercentage: beneficiaries[i].allocatedPercentage
            });
        }

        // Create escrow account
        escrowAccounts[escrowId] = EscrowAccount({
            id: escrowId,
            planId: globalPlanId,
            assetType: AssetType(assetType),
            amount: netAmount,
            isLocked: true,
            lockedAt: uint64(block.timestamp),
            fees: serviceFee
        });

        planEscrow[globalPlanId] = escrowId;

        // Track fees
        totalFeesCollected += totalFees;

        // Create distribution config and plan
        _createDistributionConfig(
            globalPlanId,
            msg.sender,
            distributionMethod,
            transferDate,
            periodicPercentage,
            netAmount,
            uint8(beneficiaries.length)
        );

        // Update user plan count
        userPlanCount[msg.sender] += 1;

        // Emit events
        emit FeeCollected(
            globalPlanId,
            totalFees,
            netAmount,
            feeConfig.feeRecipient,
            uint64(block.timestamp)
        );

        emit PlanCreated(
            globalPlanId,
            userPlanId,
            msg.sender,
            assetType,
            netAmount,
            distributionMethod,
            transferDate,
            uint8(beneficiaries.length),
            uint64(block.timestamp)
        );

        return userPlanId;
    }

    // ============================================
    // CLAIM FUNCTIONS
    // ============================================

    /**
     * @notice Allows a beneficiary to claim their inheritance
     * @dev Claimant must provide original unhashed data that matches stored hashes
     * @param planId Global plan ID
     * @param claimCode The original claim code (will be hashed and compared)
     * @param beneficiaryName Original beneficiary name (will be hashed)
     * @param beneficiaryEmail Original beneficiary email (will be hashed)
     * @param beneficiaryRelationship Original relationship (will be hashed)
     * @param beneficiaryIndex Index of the beneficiary (1-indexed)
     */
    function claimInheritance(
        uint256 planId,
        string calldata claimCode,
        string calldata beneficiaryName,
        string calldata beneficiaryEmail,
        string calldata beneficiaryRelationship,
        uint256 beneficiaryIndex
    ) external whenNotPaused nonReentrant {
        InheritancePlan storage plan = inheritancePlans[planId];
        
        // Validate plan exists and is claimable
        if (plan.id == 0) revert PlanNotFound(planId);
        if (plan.status != PlanStatus.Active && plan.status != PlanStatus.AssetsLocked) {
            revert PlanNotClaimable();
        }

        // Check transfer date has been reached
        if (block.timestamp < plan.transferDate) {
            revert TransferDateNotReached();
        }

        // Validate beneficiary index
        if (beneficiaryIndex == 0 || beneficiaryIndex > planBeneficiaryCount[planId]) {
            revert InvalidBeneficiaryData();
        }

        Beneficiary storage beneficiary = planBeneficiaries[planId][beneficiaryIndex];
        
        // Check if already claimed
        if (beneficiary.hasClaimed) revert AlreadyClaimed();

        // Verify claim code by hashing and comparing
        bytes32 providedClaimCodeHash = keccak256(abi.encodePacked(claimCode));
        if (providedClaimCodeHash != plan.claimCodeHash) {
            revert InvalidClaimCode();
        }

        // Verify beneficiary data by hashing and comparing
        bytes32 providedNameHash = keccak256(abi.encodePacked(beneficiaryName));
        bytes32 providedEmailHash = keccak256(abi.encodePacked(beneficiaryEmail));
        bytes32 providedRelationshipHash = keccak256(abi.encodePacked(beneficiaryRelationship));

        if (providedNameHash != beneficiary.nameHash ||
            providedEmailHash != beneficiary.emailHash ||
            providedRelationshipHash != beneficiary.relationshipHash) {
            revert InvalidBeneficiaryData();
        }

        // Calculate beneficiary's share based on allocated percentage
        uint256 beneficiaryShare = (plan.assetAmount * beneficiary.allocatedPercentage) / BPS_DENOMINATOR;
        
        // Get escrow and verify funds
        EscrowAccount storage escrow = escrowAccounts[plan.escrowId];
        if (escrow.amount < beneficiaryShare) {
            beneficiaryShare = escrow.amount; // Transfer remaining amount if not enough
        }

        // Update state before transfer
        beneficiary.claimedBy = msg.sender;
        beneficiary.hasClaimed = true;
        beneficiary.claimedAmount = beneficiaryShare;
        escrow.amount -= beneficiaryShare;

        // Check if all beneficiaries have claimed
        uint256 claimedCount = 0;
        for (uint256 i = 1; i <= plan.beneficiaryCount; i++) {
            if (planBeneficiaries[planId][i].hasClaimed) {
                claimedCount++;
            }
        }

        // Update plan status if fully claimed
        if (claimedCount == plan.beneficiaryCount) {
            PlanStatus oldStatus = plan.status;
            plan.status = PlanStatus.Executed;
            plan.isClaimed = true;
            emit PlanStatusChanged(planId, oldStatus, PlanStatus.Executed, uint64(block.timestamp));
        }

        // Transfer tokens to claimer
        address tokenAddress = _getTokenAddress(uint8(plan.assetType));
        IERC20(tokenAddress).safeTransfer(msg.sender, beneficiaryShare);

        emit InheritanceClaimed(planId, msg.sender, beneficiaryIndex, beneficiaryShare, uint64(block.timestamp));
    }

    /**
     * @notice Check if a plan is ready to be claimed
     * @param planId Global plan ID
     * @return Whether the plan can be claimed
     */
    function isPlanClaimable(uint256 planId) external view returns (bool) {
        InheritancePlan storage plan = inheritancePlans[planId];
        
        if (plan.status != PlanStatus.Active && plan.status != PlanStatus.AssetsLocked) {
            return false;
        }

        return block.timestamp >= plan.transferDate;
    }

    /**
     * @notice Get time remaining until plan is claimable
     * @param planId Global plan ID
     * @return Seconds until claimable (0 if already claimable)
     */
    function getTimeUntilClaimable(uint256 planId) external view returns (uint256) {
        InheritancePlan storage plan = inheritancePlans[planId];
        
        if (block.timestamp >= plan.transferDate) {
            return 0;
        }
        
        return plan.transferDate - block.timestamp;
    }

    // ============================================
    // PLAN MANAGEMENT
    // ============================================

    /**
     * @notice Pauses a plan
     * @param planId Global plan ID
     */
    function pausePlan(uint256 planId) external onlyPlanOwner(planId) planExists(planId) {
        InheritancePlan storage plan = inheritancePlans[planId];
        if (plan.status != PlanStatus.Active) revert InvalidState();
        
        PlanStatus oldStatus = plan.status;
        plan.status = PlanStatus.Paused;
        
        emit PlanStatusChanged(planId, oldStatus, PlanStatus.Paused, uint64(block.timestamp));
    }

    /**
     * @notice Resumes a paused plan
     * @param planId Global plan ID
     */
    function resumePlan(uint256 planId) external onlyPlanOwner(planId) {
        InheritancePlan storage plan = inheritancePlans[planId];
        if (plan.status != PlanStatus.Paused) revert InvalidState();
        
        PlanStatus oldStatus = plan.status;
        plan.status = PlanStatus.Active;
        
        emit PlanStatusChanged(planId, oldStatus, PlanStatus.Active, uint64(block.timestamp));
    }

    /**
     * @notice Cancels a plan and returns funds to owner
     * @param planId Global plan ID
     */
    function cancelPlan(uint256 planId) external onlyPlanOwner(planId) nonReentrant {
        InheritancePlan storage plan = inheritancePlans[planId];
        if (plan.status == PlanStatus.Executed || plan.status == PlanStatus.Cancelled) {
            revert InvalidState();
        }

        // Check if any beneficiary has claimed
        for (uint256 i = 1; i <= plan.beneficiaryCount; i++) {
            if (planBeneficiaries[planId][i].hasClaimed) {
                revert InvalidState(); // Cannot cancel if partially claimed
            }
        }

        PlanStatus oldStatus = plan.status;
        plan.status = PlanStatus.Cancelled;

        // Return remaining funds to owner
        EscrowAccount storage escrow = escrowAccounts[plan.escrowId];
        uint256 refundAmount = escrow.amount;
        escrow.amount = 0;
        escrow.isLocked = false;

        if (refundAmount > 0) {
            address tokenAddress = _getTokenAddress(uint8(plan.assetType));
            IERC20(tokenAddress).safeTransfer(plan.owner, refundAmount);
        }

        emit PlanStatusChanged(planId, oldStatus, PlanStatus.Cancelled, uint64(block.timestamp));
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get all beneficiaries for a plan (returns hashes)
     * @param planId Global plan ID
     * @return Array of beneficiary data
     */
    function getPlanBeneficiaries(uint256 planId) external view returns (Beneficiary[] memory) {
        uint256 count = planBeneficiaryCount[planId];
        Beneficiary[] memory beneficiaries = new Beneficiary[](count);
        
        for (uint256 i = 0; i < count; i++) {
            beneficiaries[i] = planBeneficiaries[planId][i + 1];
        }
        
        return beneficiaries;
    }

    /**
     * @notice Get user's plans
     * @param user User address
     * @return Array of global plan IDs
     */
    function getUserPlans(address user) external view returns (uint256[] memory) {
        uint256 count = userPlanCount[user];
        uint256[] memory plans = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            plans[i] = userPlanIdToGlobal[user][i + 1];
        }
        
        return plans;
    }

    /**
     * @notice Preview plan creation fee
     * @param assetAmount Amount to calculate fee for
     * @return Fee amount
     */
    function previewPlanCreationFee(uint256 assetAmount) public pure returns (uint256) {
        return _calculatePlanCreationFee(assetAmount);
    }

    /**
     * @notice Verify beneficiary data matches stored hash
     * @param planId Plan ID
     * @param beneficiaryIndex Beneficiary index (1-indexed)
     * @param name Beneficiary name to verify
     * @param email Beneficiary email to verify
     * @param relationship Beneficiary relationship to verify
     * @return Whether the data matches
     */
    function verifyBeneficiaryData(
        uint256 planId,
        uint256 beneficiaryIndex,
        string calldata name,
        string calldata email,
        string calldata relationship
    ) external view returns (bool) {
        if (beneficiaryIndex == 0 || beneficiaryIndex > planBeneficiaryCount[planId]) {
            return false;
        }

        Beneficiary storage ben = planBeneficiaries[planId][beneficiaryIndex];
        
        bytes32 nameHash = keccak256(abi.encodePacked(name));
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        bytes32 relationshipHash = keccak256(abi.encodePacked(relationship));

        return nameHash == ben.nameHash &&
               emailHash == ben.emailHash &&
               relationshipHash == ben.relationshipHash;
    }

    /**
     * @notice Verify claim code matches stored hash
     * @param planId Plan ID
     * @param claimCode Claim code to verify
     * @return Whether the claim code matches
     */
    function verifyClaimCode(uint256 planId, string calldata claimCode) external view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(claimCode));
        return hash == inheritancePlans[planId].claimCodeHash;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Updates fee configuration
     */
    function updateFeeConfig(
        uint256 newFeePercentage,
        address newFeeRecipient
    ) external onlyRole(ADMIN_ROLE) {
        if (newFeeRecipient == address(0)) revert ZeroAddress();
        if (newFeePercentage > 1000) revert InvalidInput(); // Max 10%
        
        feeConfig.feePercentage = newFeePercentage;
        feeConfig.feeRecipient = newFeeRecipient;
    }

    /**
     * @notice Updates token addresses
     */
    function updateTokenAddresses(
        address _primaryToken,
        address _usdtToken,
        address _usdcToken
    ) external onlyRole(ADMIN_ROLE) {
        primaryToken = _primaryToken;
        usdtToken = _usdtToken;
        usdcToken = _usdcToken;
    }

    /**
     * @notice Pauses the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    /**
     * @notice Validates beneficiary inputs
     */
    function _validateBeneficiaryInputs(
        BeneficiaryInput[] calldata beneficiaries
    ) internal pure {
        uint256 length = beneficiaries.length;

        if (length == 0) revert InvalidBeneficiaries();
        if (length > MAX_BENEFICIARIES) {
            revert MaxBeneficiariesReached(MAX_BENEFICIARIES);
        }

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < length; i++) {
            if (beneficiaries[i].nameHash == bytes32(0) ||
                beneficiaries[i].emailHash == bytes32(0) ||
                beneficiaries[i].relationshipHash == bytes32(0)) {
                revert InvalidInput();
            }
            if (beneficiaries[i].allocatedPercentage == 0) {
                revert InvalidPercentage(beneficiaries[i].allocatedPercentage);
            }
            totalPercentage += beneficiaries[i].allocatedPercentage;
        }

        // Total must equal 100% (10000 basis points)
        if (totalPercentage != BPS_DENOMINATOR) {
            revert PercentageMustEqual100(totalPercentage);
        }
    }

    /**
     * @notice Validates distribution method configuration
     */
    function _validateDistributionMethod(
        uint8 distributionMethod,
        uint8 periodicPercentage
    ) internal pure {
        if (distributionMethod > uint8(DistributionMethod.Monthly)) {
            revert InvalidInput();
        }

        if (distributionMethod == uint8(DistributionMethod.LumpSum)) {
            // Lump sum doesn't need periodic percentage
            return;
        }

        // For periodic distributions, validate percentage
        if (periodicPercentage == 0 || periodicPercentage > 100) {
            revert InvalidPercentage(periodicPercentage);
        }
        if (100 % periodicPercentage != 0) {
            revert InvalidPercentage(periodicPercentage);
        }
    }

    /**
     * @notice Gets token address from asset type
     */
    function _getTokenAddress(uint8 assetType) internal view returns (address) {
        if (assetType == uint8(AssetType.ERC20_TOKEN1)) {
            if (primaryToken == address(0)) revert ZeroAddress();
            return primaryToken;
        } else if (assetType == uint8(AssetType.ERC20_TOKEN2)) {
            if (usdtToken == address(0)) revert ZeroAddress();
            return usdtToken;
        } else if (assetType == uint8(AssetType.ERC20_TOKEN3)) {
            if (usdcToken == address(0)) revert ZeroAddress();
            return usdcToken;
        }
        revert InvalidAssetType(assetType);
    }

    /**
     * @notice Calculates plan creation fee (5%)
     */
    function _calculatePlanCreationFee(uint256 assetAmount) internal pure returns (uint256) {
        if (assetAmount == 0) return 0;
        return (assetAmount * PLAN_CREATION_FEE_BPS) / BPS_DENOMINATOR;
    }

    /**
     * @notice Calculates service fee based on config
     */
    function _calculateFee(uint256 amount)
        internal
        view
        returns (uint256 feeAmount, uint256 netAmount)
    {
        if (!feeConfig.isActive) {
            return (0, amount);
        }

        feeAmount = (amount * feeConfig.feePercentage) / BPS_DENOMINATOR;

        if (feeAmount < feeConfig.minFee) {
            feeAmount = feeConfig.minFee;
        } else if (feeAmount > feeConfig.maxFee) {
            feeAmount = feeConfig.maxFee;
        }

        if (feeAmount > amount) {
            feeAmount = amount;
        }

        netAmount = amount - feeAmount;
    }

    /**
     * @notice Creates distribution configuration and plan
     */
    function _createDistributionConfig(
        uint256 planId,
        address owner,
        uint8 distributionMethod,
        uint64 transferDate,
        uint8 periodicPercentage,
        uint256 netAmount,
        uint8 beneficiariesCount
    ) internal {
        DistributionMethod method = DistributionMethod(distributionMethod);
        uint64 currentTime = uint64(block.timestamp);

        // Store distribution config
        DistributionConfig storage config = distributionConfigs[planId];
        config.distributionMethod = method;
        config.transferDate = transferDate;
        config.periodicPercentage = periodicPercentage;

        // Calculate distribution schedule
        uint256 periodAmount = netAmount;
        uint8 totalPeriods = 1;
        uint64 nextDisbursementDate = transferDate;
        uint64 startDate = transferDate;
        uint64 endDate = transferDate;

        if (method != DistributionMethod.LumpSum) {
            uint64 periodLength;

            if (method == DistributionMethod.Quarterly) {
                periodLength = 90 days;
            } else if (method == DistributionMethod.Yearly) {
                periodLength = 365 days;
            } else {
                periodLength = 30 days;
            }

            totalPeriods = uint8(100 / periodicPercentage);
            periodAmount = (netAmount * periodicPercentage) / 100;
            startDate = transferDate;
            nextDisbursementDate = transferDate;
            endDate = transferDate + periodLength * totalPeriods;
        }

        config.startDate = startDate;
        config.endDate = endDate;

        // Store distribution plan
        distributionPlans[planId] = DistributionPlan({
            planId: planId,
            owner: owner,
            totalAmount: netAmount,
            distributionMethod: method,
            periodAmount: periodAmount,
            startDate: startDate,
            endDate: endDate,
            totalPeriods: totalPeriods,
            completedPeriods: 0,
            nextDisbursementDate: nextDisbursementDate,
            isActive: true,
            disbursementStatus: DisbursementStatus.Pending,
            createdAt: currentTime
        });
    }

    /**
     * @notice Authorizes contract upgrades
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(ADMIN_ROLE)
    {}
}
