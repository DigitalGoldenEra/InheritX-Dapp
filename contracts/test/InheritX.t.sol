// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {
    InheritX,
    KYCStatus,
    AssetType,
    PlanStatus,
    DistributionMethod,
    BeneficiaryInput,
    Beneficiary,
    InheritancePlan,
    UserPlanMapping,
    FeeConfig,
    ZeroAddress,
    Unauthorized,
    InvalidInput,
    InvalidState,
    PlanNotFound,
    PlanNotActive,
    InvalidBeneficiaries,
    MaxBeneficiariesReached,
    InvalidPercentage,
    PercentageMustEqual100,
    InvalidAssetType,
    InsufficientAllowance,
    InsufficientUserBalance,
    TransferFailed,
    InvalidClaimCode,
    InvalidBeneficiaryData,
    AlreadyClaimed,
    PlanNotClaimable,
    TransferDateNotReached,
    KYCNotApproved,
    KYCAlreadySubmitted
} from "../InheritX.sol";
import {MockERC20} from "../MockERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title InheritX Comprehensive Test Suite
 * @notice Tests all functionality of the InheritX contract
 * @dev Covers all functions, edge cases, and error conditions
 */
contract InheritXTest is Test {
    InheritX public inheritX;
    InheritX public implementation;
    MockERC20 public primaryToken;
    MockERC20 public usdtToken;
    MockERC20 public usdcToken;

    address public admin = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public beneficiary1 = address(0x4);
    address public beneficiary2 = address(0x5);
    address public feeRecipient = address(0x6);

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Test data
    bytes32 constant PLAN_NAME_HASH = keccak256("Test Plan");
    bytes32 constant PLAN_DESC_HASH = keccak256("Test Description");
    bytes32 constant CLAIM_CODE_HASH = keccak256("SECRET123");
    string constant CLAIM_CODE = "SECRET123";
    string constant BENEFICIARY_NAME = "John Doe";
    string constant BENEFICIARY_EMAIL = "john@example.com";
    string constant BENEFICIARY_RELATIONSHIP = "Son";
    bytes32 constant KYC_DATA_HASH = keccak256("KYC_DATA");

    uint256 constant INITIAL_BALANCE = 1000000 * 1e18;
    uint256 constant PLAN_AMOUNT = 10000 * 1e18;
    // FUTURE_DATE will be set in setUp() using block.timestamp
    uint64 public FUTURE_DATE;

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

    event KYCStatusChanged(
        address indexed user,
        KYCStatus oldStatus,
        KYCStatus newStatus,
        address indexed reviewedBy,
        uint64 changedAt
    );

    event InheritanceClaimed(
        uint256 indexed planId,
        address indexed claimer,
        uint256 beneficiaryIndex,
        uint256 amount,
        uint64 claimedAt
    );

    event PlanStatusChanged(
        uint256 indexed planId,
        PlanStatus oldStatus,
        PlanStatus newStatus,
        uint64 changedAt
    );

    event FeeCollected(
        uint256 indexed planId,
        uint256 feeAmount,
        uint256 netAmount,
        address feeRecipient,
        uint64 collectedAt
    );

    function setUp() public {
        // Deploy mock tokens
        primaryToken = new MockERC20("Primary Token", "PRIMARY", 18);
        usdtToken = new MockERC20("USDT", "USDT", 6);
        usdcToken = new MockERC20("USDC", "USDC", 6);

        // Mint tokens to users
        primaryToken.mint(user1, INITIAL_BALANCE);
        primaryToken.mint(user2, INITIAL_BALANCE);
        usdtToken.mint(user1, INITIAL_BALANCE);
        usdcToken.mint(user1, INITIAL_BALANCE);

        // Deploy implementation
        implementation = new InheritX();

        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            InheritX.initialize.selector,
            admin,
            address(primaryToken),
            address(usdtToken),
            address(usdcToken)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        inheritX = InheritX(payable(address(proxy)));

        // Setup roles
        vm.startPrank(admin);
        inheritX.grantRole(ADMIN_ROLE, admin);
        inheritX.grantRole(OPERATOR_ROLE, admin);
        vm.stopPrank();

        // Set FUTURE_DATE (can't be constant because it uses block.timestamp)
        FUTURE_DATE = uint64(block.timestamp + 365 days);
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function _createBeneficiaryInput(
        string memory name,
        string memory email,
        string memory relationship,
        uint256 percentage
    ) internal pure returns (BeneficiaryInput memory) {
        return BeneficiaryInput({
            nameHash: keccak256(bytes(name)),
            emailHash: keccak256(bytes(email)),
            relationshipHash: keccak256(bytes(relationship)),
            allocatedPercentage: percentage
        });
    }

    function _getBeneficiaryHashes(
        string memory name,
        string memory email,
        string memory relationship
    ) internal pure returns (bytes32, bytes32, bytes32) {
        return (
            keccak256(bytes(name)),
            keccak256(bytes(email)),
            keccak256(bytes(relationship))
        );
    }

    function _approveAndFund(address user, uint256 amount, address token) internal {
        vm.startPrank(user);
        IERC20(token).approve(address(inheritX), amount);
        vm.stopPrank();
    }

    // ============================================
    // INITIALIZATION TESTS
    // ============================================

    function test_Initialization() public {
        assertEq(address(inheritX.primaryToken()), address(primaryToken));
        assertEq(address(inheritX.usdtToken()), address(usdtToken));
        assertEq(address(inheritX.usdcToken()), address(usdcToken));
        assertTrue(inheritX.hasRole(ADMIN_ROLE, admin));
        assertTrue(inheritX.kycRequired());
        assertEq(inheritX.planCount(), 0);
    }

    function test_Initialization_RevertIf_ZeroAdmin() public {
        InheritX newImpl = new InheritX();
        bytes memory initData = abi.encodeWithSelector(
            InheritX.initialize.selector,
            address(0),
            address(primaryToken),
            address(usdtToken),
            address(usdcToken)
        );
        vm.expectRevert(ZeroAddress.selector);
        new ERC1967Proxy(address(newImpl), initData);
    }

    function test_Initialization_RevertIf_AlreadyInitialized() public {
        vm.expectRevert();
        inheritX.initialize(
            admin,
            address(primaryToken),
            address(usdtToken),
            address(usdcToken)
        );
    }

    // ============================================
    // KYC TESTS
    // ============================================

    function test_ApproveKYC_NewUser() public {
        vm.prank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);

        assertEq(uint8(inheritX.getKYCStatus(user1)), uint8(KYCStatus.Approved));
        assertTrue(inheritX.isKYCApproved(user1));
    }

    function test_ApproveKYC_WithoutHash() public {
        vm.prank(admin);
        inheritX.approveKYC(user1, bytes32(0));

        assertEq(uint8(inheritX.getKYCStatus(user1)), uint8(KYCStatus.Approved));
    }

    function test_ApproveKYC_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        inheritX.approveKYC(user1, KYC_DATA_HASH);
    }

    function test_ApproveKYC_RevertIf_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(ZeroAddress.selector);
        inheritX.approveKYC(address(0), KYC_DATA_HASH);
    }

    function test_ApproveKYC_RevertIf_AlreadyApproved() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.expectRevert(KYCAlreadySubmitted.selector);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();
    }

    function test_RejectKYC_NewUser() public {
        vm.prank(admin);
        inheritX.rejectKYC(user1);

        assertEq(uint8(inheritX.getKYCStatus(user1)), uint8(KYCStatus.Rejected));
        assertFalse(inheritX.isKYCApproved(user1));
    }

    function test_RejectKYC_CanUpdateRejected() public {
        vm.startPrank(admin);
        inheritX.rejectKYC(user1);
        // Can reject again (updates timestamp)
        inheritX.rejectKYC(user1);
        vm.stopPrank();

        assertEq(uint8(inheritX.getKYCStatus(user1)), uint8(KYCStatus.Rejected));
    }

    function test_RejectKYC_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        inheritX.rejectKYC(user1);
    }

    function test_RejectKYC_RevertIf_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(ZeroAddress.selector);
        inheritX.rejectKYC(address(0));
    }

    function test_GetKYCStatus_NotSubmitted() public {
        assertEq(uint8(inheritX.getKYCStatus(user1)), uint8(KYCStatus.NotSubmitted));
    }

    function test_IsKYCApproved_False() public {
        assertFalse(inheritX.isKYCApproved(user1));
    }

    function test_SetKYCRequired() public {
        vm.prank(admin);
        inheritX.setKYCRequired(false);
        assertFalse(inheritX.kycRequired());

        vm.prank(admin);
        inheritX.setKYCRequired(true);
        assertTrue(inheritX.kycRequired());
    }

    function test_SetKYCRequired_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        inheritX.setKYCRequired(false);
    }

    // ============================================
    // PLAN CREATION TESTS - PRIMARY TOKEN
    // ============================================

    function test_CreatePlan_PrimaryToken_LumpSum() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000 // 100%
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000; // 2%
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        uint256 userPlanId = inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0, // Not used for lump sum
            CLAIM_CODE_HASH
        );

        assertEq(userPlanId, 1);
        assertEq(inheritX.planCount(), 1);
        assertEq(inheritX.userPlanCount(user1), 1);
    }

    function test_CreatePlan_USDT_Monthly() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 amount = 10000 * 1e6; // USDT has 6 decimals
        uint256 creationFee = inheritX.previewPlanCreationFee(amount);
        uint256 totalRequired = amount + creationFee;

        _approveAndFund(user1, totalRequired, address(usdtToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN2),
            amount,
            uint8(DistributionMethod.Monthly),
            FUTURE_DATE,
            25, // 25% per month (4 months total)
            CLAIM_CODE_HASH
        );

        assertEq(inheritX.planCount(), 1);
    }

    function test_CreatePlan_USDC_Quarterly() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 amount = 10000 * 1e6;
        uint256 creationFee = inheritX.previewPlanCreationFee(amount);
        uint256 totalRequired = amount + creationFee;

        _approveAndFund(user1, totalRequired, address(usdcToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN3),
            amount,
            uint8(DistributionMethod.Quarterly),
            FUTURE_DATE,
            25, // 25% per quarter
            CLAIM_CODE_HASH
        );

        assertEq(inheritX.planCount(), 1);
    }

    function test_CreatePlan_Yearly() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.Yearly),
            FUTURE_DATE,
            20, // 20% per year (5 years)
            CLAIM_CODE_HASH
        );

        assertEq(inheritX.planCount(), 1);
    }

    function test_CreatePlan_MultipleBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](2);
        beneficiaries[0] = _createBeneficiaryInput("Alice", "alice@test.com", "Daughter", 6000);
        beneficiaries[1] = _createBeneficiaryInput("Bob", "bob@test.com", "Son", 4000);

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        uint256 userPlanId = inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        assertEq(userPlanId, 1);
        Beneficiary[] memory planBeneficiaries = inheritX.getPlanBeneficiaries(1);
        assertEq(planBeneficiaries.length, 2);
    }

    function test_CreatePlan_MaxBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](10);
        uint256 percentagePerBeneficiary = 1000; // 10% each

        for (uint256 i = 0; i < 10; i++) {
            beneficiaries[i] = _createBeneficiaryInput(
                string(abi.encodePacked("Beneficiary", i)),
                string(abi.encodePacked("ben", i, "@test.com")),
                "Relative",
                percentagePerBeneficiary
            );
        }

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        Beneficiary[] memory planBeneficiaries = inheritX.getPlanBeneficiaries(1);
        assertEq(planBeneficiaries.length, 10);
    }

    // ============================================
    // PLAN CREATION - VALIDATION TESTS
    // ============================================

    function test_CreatePlan_RevertIf_KYCNotApproved() public {
        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(KYCNotApproved.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_KYCRequiredDisabled() public {
        vm.startPrank(admin);
        inheritX.setKYCRequired(false);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        assertEq(inheritX.planCount(), 1);
    }

    function test_CreatePlan_RevertIf_ZeroPlanNameHash() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            bytes32(0),
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_ZeroPlanDescHash() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            bytes32(0),
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_ZeroClaimCodeHash() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            bytes32(0)
        );
    }

    function test_CreatePlan_RevertIf_ZeroAmount() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            0,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_PastTransferDate() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            uint64(block.timestamp - 1),
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_NoBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](0);

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidBeneficiaries.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_TooManyBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](11);
        for (uint256 i = 0; i < 11; i++) {
            beneficiaries[i] = _createBeneficiaryInput(
                string(abi.encodePacked("Ben", i)),
                string(abi.encodePacked("ben", i, "@test.com")),
                "Relative",
                909 // ~9.09% each
            );
        }

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_PercentageNot100() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](2);
        beneficiaries[0] = _createBeneficiaryInput("Alice", "alice@test.com", "Daughter", 6000);
        beneficiaries[1] = _createBeneficiaryInput("Bob", "bob@test.com", "Son", 3000); // Only 90%

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_ZeroPercentage() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            0
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_InvalidAssetType() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            99, // Invalid asset type
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_InsufficientAllowance() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        // Approve less than required
        vm.prank(user1);
        IERC20(address(primaryToken)).approve(address(inheritX), totalRequired - 1);

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_InsufficientBalance() public {
        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        // Approve KYC for user2
        vm.startPrank(admin);
        inheritX.approveKYC(user2, KYC_DATA_HASH);
        vm.stopPrank();

        // Transfer most of user2's balance away, leaving only half of what's needed
        uint256 insufficientBalance = totalRequired / 2;
        vm.prank(user2);
        IERC20(address(primaryToken)).transfer(address(0x999), INITIAL_BALANCE - insufficientBalance);

        // Verify user2 has insufficient balance
        uint256 user2Balance = IERC20(address(primaryToken)).balanceOf(user2);
        assertLt(user2Balance, totalRequired, "User2 should have insufficient balance");

        vm.startPrank(user2);
        IERC20(address(primaryToken)).approve(address(inheritX), totalRequired);

        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
        vm.stopPrank();
    }

    function test_CreatePlan_RevertIf_InvalidDistributionMethod() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            99, // Invalid distribution method
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_InvalidPeriodicPercentage() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.Monthly),
            FUTURE_DATE,
            30, // 30% doesn't divide evenly into 100
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_ZeroPeriodicPercentage() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.Monthly),
            FUTURE_DATE,
            0, // Zero percentage for periodic
            CLAIM_CODE_HASH
        );
    }

    function test_CreatePlan_RevertIf_InvalidHashInBeneficiary() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = BeneficiaryInput({
            nameHash: bytes32(0), // Invalid
            emailHash: keccak256(bytes(BENEFICIARY_EMAIL)),
            relationshipHash: keccak256(bytes(BENEFICIARY_RELATIONSHIP)),
            allocatedPercentage: 10000
        });

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert(InvalidInput.selector);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    // ============================================
    // FEE CALCULATION TESTS
    // ============================================

    function test_PreviewPlanCreationFee() public {
        uint256 fee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 expectedFee = (PLAN_AMOUNT * 500) / 10000; // 5%
        assertEq(fee, expectedFee);
    }

    function test_PreviewPlanCreationFee_ZeroAmount() public {
        uint256 fee = inheritX.previewPlanCreationFee(0);
        assertEq(fee, 0);
    }

    function test_FeeCollection() public {
        // Update fee recipient to test address
        vm.prank(admin);
        inheritX.updateFeeConfig(200, feeRecipient); // 2%

        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000; // 2%
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        uint256 feeRecipientBalanceBefore = IERC20(address(primaryToken)).balanceOf(feeRecipient);
        uint256 contractBalanceBefore = IERC20(address(primaryToken)).balanceOf(address(inheritX));

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        uint256 feeRecipientBalanceAfter = IERC20(address(primaryToken)).balanceOf(feeRecipient);
        uint256 contractBalanceAfter = IERC20(address(primaryToken)).balanceOf(address(inheritX));

        uint256 totalFees = creationFee + serviceFee;
        assertEq(feeRecipientBalanceAfter - feeRecipientBalanceBefore, totalFees);
        assertEq(contractBalanceAfter - contractBalanceBefore, PLAN_AMOUNT - serviceFee);
    }

    // ============================================
    // CLAIM TESTS
    // ============================================

    function _createPlanForClaiming() internal returns (uint256) {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        return inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_ClaimInheritance_Success() public {
        _createPlanForClaiming();
        uint256 globalPlanId = 1;

        // Fast forward to transfer date
        vm.warp(FUTURE_DATE);

        uint256 beneficiaryBalanceBefore = IERC20(address(primaryToken)).balanceOf(beneficiary1);

        vm.prank(beneficiary1);
        inheritX.claimInheritance(
            globalPlanId,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1 // beneficiary index (1-indexed)
        );

        uint256 beneficiaryBalanceAfter = IERC20(address(primaryToken)).balanceOf(beneficiary1);
        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000;
        uint256 expectedAmount = PLAN_AMOUNT - serviceFee;

        assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedAmount);

        (
            bytes32 nameHash,
            bytes32 emailHash,
            bytes32 relationshipHash,
            bytes32 beneficiaryDataHash,
            address claimedBy,
            bool hasClaimed,
            uint256 claimedAmount,
            uint256 allocatedPercentage
        ) = inheritX.planBeneficiaries(globalPlanId, 1);
        Beneficiary memory beneficiary = Beneficiary({
            nameHash: nameHash,
            emailHash: emailHash,
            relationshipHash: relationshipHash,
            beneficiaryDataHash: beneficiaryDataHash,
            claimedBy: claimedBy,
            hasClaimed: hasClaimed,
            claimedAmount: claimedAmount,
            allocatedPercentage: allocatedPercentage
        });
        assertTrue(beneficiary.hasClaimed);
        assertEq(beneficiary.claimedBy, beneficiary1);
    }

    function test_ClaimInheritance_RevertIf_PlanNotFound() public {
        vm.warp(FUTURE_DATE);

        vm.prank(beneficiary1);
        vm.expectRevert();
        inheritX.claimInheritance(
            999, // Non-existent plan
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );
    }

    function test_ClaimInheritance_RevertIf_TransferDateNotReached() public {
        _createPlanForClaiming();

        vm.prank(beneficiary1);
        vm.expectRevert(TransferDateNotReached.selector);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );
    }

    function test_ClaimInheritance_RevertIf_InvalidClaimCode() public {
        _createPlanForClaiming();
        vm.warp(FUTURE_DATE);

        vm.prank(beneficiary1);
        vm.expectRevert(InvalidClaimCode.selector);
        inheritX.claimInheritance(
            1,
            "WRONG_CODE",
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );
    }

    function test_ClaimInheritance_RevertIf_InvalidBeneficiaryData() public {
        _createPlanForClaiming();
        vm.warp(FUTURE_DATE);

        vm.prank(beneficiary1);
        vm.expectRevert(InvalidBeneficiaryData.selector);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            "Wrong Name",
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );
    }

    function test_ClaimInheritance_RevertIf_InvalidBeneficiaryIndex() public {
        _createPlanForClaiming();
        vm.warp(FUTURE_DATE);

        vm.prank(beneficiary1);
        vm.expectRevert(InvalidBeneficiaryData.selector);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            0 // Invalid index (1-indexed)
        );
    }

    function test_ClaimInheritance_RevertIf_AlreadyClaimed() public {
        // Create plan with 2 beneficiaries so plan doesn't become Executed after first claim
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](2);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            5000 // 50%
        );
        beneficiaries[1] = _createBeneficiaryInput(
            "Jane Doe",
            "jane@example.com",
            "Daughter",
            5000 // 50%
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        vm.warp(FUTURE_DATE);

        vm.startPrank(beneficiary1);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );

        vm.expectRevert(AlreadyClaimed.selector);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );
        vm.stopPrank();
    }

    function test_ClaimInheritance_MultipleBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](2);
        beneficiaries[0] = _createBeneficiaryInput("Alice", "alice@test.com", "Daughter", 6000);
        beneficiaries[1] = _createBeneficiaryInput("Bob", "bob@test.com", "Son", 4000);

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        vm.warp(FUTURE_DATE);

        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000;
        uint256 netAmount = PLAN_AMOUNT - serviceFee;

        // Alice claims 60%
        vm.prank(beneficiary1);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            "Alice",
            "alice@test.com",
            "Daughter",
            1
        );

        assertEq(
            IERC20(address(primaryToken)).balanceOf(beneficiary1),
            (netAmount * 6000) / 10000
        );

        // Bob claims 40%
        vm.prank(beneficiary2);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            "Bob",
            "bob@test.com",
            "Son",
            2
        );

        assertEq(
            IERC20(address(primaryToken)).balanceOf(beneficiary2),
            (netAmount * 4000) / 10000
        );

        // Plan should be executed
        (
            uint256 id,
            address owner,
            uint8 beneficiaryCount,
            AssetType assetType,
            uint256 assetAmount,
            uint64 createdAt,
            uint64 transferDate,
            PlanStatus status,
            bool isClaimed,
            bytes32 claimCodeHash,
            uint256 escrowId
        ) = inheritX.inheritancePlans(1);
        InheritancePlan memory plan = InheritancePlan({
            id: id,
            owner: owner,
            beneficiaryCount: beneficiaryCount,
            assetType: assetType,
            assetAmount: assetAmount,
            createdAt: createdAt,
            transferDate: transferDate,
            status: status,
            isClaimed: isClaimed,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });
        assertEq(uint8(plan.status), uint8(PlanStatus.Executed));
        assertTrue(plan.isClaimed);
    }

    function test_VerifyBeneficiaryData() public {
        _createPlanForClaiming();

        bool isValid = inheritX.verifyBeneficiaryData(
            1,
            1,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP
        );
        assertTrue(isValid);

        bool isInvalid = inheritX.verifyBeneficiaryData(
            1,
            1,
            "Wrong Name",
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP
        );
        assertFalse(isInvalid);
    }

    function test_VerifyClaimCode() public {
        _createPlanForClaiming();

        bool isValid = inheritX.verifyClaimCode(1, CLAIM_CODE);
        assertTrue(isValid);

        bool isInvalid = inheritX.verifyClaimCode(1, "WRONG_CODE");
        assertFalse(isInvalid);
    }

    function test_IsPlanClaimable() public {
        _createPlanForClaiming();

        assertFalse(inheritX.isPlanClaimable(1));

        vm.warp(FUTURE_DATE);
        assertTrue(inheritX.isPlanClaimable(1));
    }

    function test_GetTimeUntilClaimable() public {
        _createPlanForClaiming();

        uint256 timeRemaining = inheritX.getTimeUntilClaimable(1);
        assertGt(timeRemaining, 0);

        vm.warp(FUTURE_DATE);
        assertEq(inheritX.getTimeUntilClaimable(1), 0);
    }

    // ============================================
    // PLAN MANAGEMENT TESTS
    // ============================================

    function test_PausePlan() public {
        _createPlanForClaiming();

        vm.prank(user1);
        inheritX.pausePlan(1);

        (
            uint256 id,
            address owner,
            uint8 beneficiaryCount,
            AssetType assetType,
            uint256 assetAmount,
            uint64 createdAt,
            uint64 transferDate,
            PlanStatus status,
            bool isClaimed,
            bytes32 claimCodeHash,
            uint256 escrowId
        ) = inheritX.inheritancePlans(1);
        InheritancePlan memory plan = InheritancePlan({
            id: id,
            owner: owner,
            beneficiaryCount: beneficiaryCount,
            assetType: assetType,
            assetAmount: assetAmount,
            createdAt: createdAt,
            transferDate: transferDate,
            status: status,
            isClaimed: isClaimed,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });
        assertEq(uint8(plan.status), uint8(PlanStatus.Paused));
    }

    function test_PausePlan_RevertIf_NotOwner() public {
        _createPlanForClaiming();

        vm.prank(user2);
        vm.expectRevert(Unauthorized.selector);
        inheritX.pausePlan(1);
    }

    function test_PausePlan_RevertIf_NotActive() public {
        _createPlanForClaiming();

        vm.startPrank(user1);
        inheritX.pausePlan(1);
        vm.expectRevert(InvalidState.selector);
        inheritX.pausePlan(1); // Already paused
        vm.stopPrank();
    }

    function test_ResumePlan() public {
        _createPlanForClaiming();

        vm.startPrank(user1);
        inheritX.pausePlan(1);
        inheritX.resumePlan(1);
        vm.stopPrank();

        (
            uint256 id,
            address owner,
            uint8 beneficiaryCount,
            AssetType assetType,
            uint256 assetAmount,
            uint64 createdAt,
            uint64 transferDate,
            PlanStatus status,
            bool isClaimed,
            bytes32 claimCodeHash,
            uint256 escrowId
        ) = inheritX.inheritancePlans(1);
        InheritancePlan memory plan = InheritancePlan({
            id: id,
            owner: owner,
            beneficiaryCount: beneficiaryCount,
            assetType: assetType,
            assetAmount: assetAmount,
            createdAt: createdAt,
            transferDate: transferDate,
            status: status,
            isClaimed: isClaimed,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });
        assertEq(uint8(plan.status), uint8(PlanStatus.Active));
    }

    function test_ResumePlan_RevertIf_NotPaused() public {
        _createPlanForClaiming();

        vm.prank(user1);
        vm.expectRevert(InvalidState.selector);
        inheritX.resumePlan(1);
    }

    function test_CancelPlan() public {
        _createPlanForClaiming();

        uint256 ownerBalanceBefore = IERC20(address(primaryToken)).balanceOf(user1);

        vm.prank(user1);
        inheritX.cancelPlan(1);

        uint256 ownerBalanceAfter = IERC20(address(primaryToken)).balanceOf(user1);
        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000;
        uint256 netAmount = PLAN_AMOUNT - serviceFee;

        assertEq(ownerBalanceAfter - ownerBalanceBefore, netAmount);

        (
            uint256 id,
            address owner,
            uint8 beneficiaryCount,
            AssetType assetType,
            uint256 assetAmount,
            uint64 createdAt,
            uint64 transferDate,
            PlanStatus status,
            bool isClaimed,
            bytes32 claimCodeHash,
            uint256 escrowId
        ) = inheritX.inheritancePlans(1);
        InheritancePlan memory plan = InheritancePlan({
            id: id,
            owner: owner,
            beneficiaryCount: beneficiaryCount,
            assetType: assetType,
            assetAmount: assetAmount,
            createdAt: createdAt,
            transferDate: transferDate,
            status: status,
            isClaimed: isClaimed,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });
        assertEq(uint8(plan.status), uint8(PlanStatus.Cancelled));
    }

    function test_CancelPlan_RevertIf_NotOwner() public {
        _createPlanForClaiming();

        vm.prank(user2);
        vm.expectRevert(Unauthorized.selector);
        inheritX.cancelPlan(1);
    }

    function test_CancelPlan_RevertIf_AlreadyExecuted() public {
        _createPlanForClaiming();
        vm.warp(FUTURE_DATE);

        vm.prank(beneficiary1);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );

        vm.prank(user1);
        vm.expectRevert(InvalidState.selector);
        inheritX.cancelPlan(1);
    }

    function test_CancelPlan_RevertIf_AlreadyCancelled() public {
        _createPlanForClaiming();

        vm.startPrank(user1);
        inheritX.cancelPlan(1);
        vm.expectRevert(InvalidState.selector);
        inheritX.cancelPlan(1);
        vm.stopPrank();
    }

    // ============================================
    // ADMIN FUNCTIONS TESTS
    // ============================================

    function test_UpdateFeeConfig() public {
        vm.prank(admin);
        inheritX.updateFeeConfig(300, feeRecipient); // 3%

        (
            uint256 feePercentage,
            address configFeeRecipient,
            bool isActive,
            uint256 minFee,
            uint256 maxFee
        ) = inheritX.feeConfig();
        FeeConfig memory config = FeeConfig({
            feePercentage: feePercentage,
            feeRecipient: configFeeRecipient,
            isActive: isActive,
            minFee: minFee,
            maxFee: maxFee
        });
        assertEq(config.feePercentage, 300);
        assertEq(config.feeRecipient, feeRecipient);
    }

    function test_UpdateFeeConfig_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        inheritX.updateFeeConfig(300, feeRecipient);
    }

    function test_UpdateFeeConfig_RevertIf_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(ZeroAddress.selector);
        inheritX.updateFeeConfig(300, address(0));
    }

    function test_UpdateFeeConfig_RevertIf_TooHigh() public {
        vm.prank(admin);
        vm.expectRevert(InvalidInput.selector);
        inheritX.updateFeeConfig(1001, feeRecipient); // > 10%
    }

    function test_UpdateTokenAddresses() public {
        MockERC20 newToken = new MockERC20("New Token", "NEW", 18);

        vm.prank(admin);
        inheritX.updateTokenAddresses(
            address(newToken),
            address(usdtToken),
            address(usdcToken)
        );

        assertEq(address(inheritX.primaryToken()), address(newToken));
    }

    function test_UpdateTokenAddresses_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        inheritX.updateTokenAddresses(
            address(primaryToken),
            address(usdtToken),
            address(usdcToken)
        );
    }

    function test_Pause() public {
        vm.prank(admin);
        inheritX.pause();

        // Should revert when paused
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        vm.expectRevert();
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );
    }

    function test_Unpause() public {
        vm.startPrank(admin);
        inheritX.pause();
        inheritX.unpause();
        vm.stopPrank();

        // Should work after unpause
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        assertEq(inheritX.planCount(), 1);
    }

    // ============================================
    // VIEW FUNCTIONS TESTS
    // ============================================

    function test_GetUserPlans() public {
        _createPlanForClaiming();

        uint256[] memory plans = inheritX.getUserPlans(user1);
        assertEq(plans.length, 1);
        assertEq(plans[0], 1);
    }

    function test_GetUserPlans_Empty() public {
        uint256[] memory plans = inheritX.getUserPlans(user1);
        assertEq(plans.length, 0);
    }

    function test_GetPlanBeneficiaries() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](2);
        beneficiaries[0] = _createBeneficiaryInput("Alice", "alice@test.com", "Daughter", 6000);
        beneficiaries[1] = _createBeneficiaryInput("Bob", "bob@test.com", "Son", 4000);

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        Beneficiary[] memory planBeneficiaries = inheritX.getPlanBeneficiaries(1);
        assertEq(planBeneficiaries.length, 2);
    }

    // ============================================
    // EDGE CASES AND INTEGRATION TESTS
    // ============================================

    function test_MultiplePlans_SameUser() public {
        vm.startPrank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);
        vm.stopPrank();

        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired * 2, address(primaryToken));

        vm.startPrank(user1);
        uint256 plan1 = inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        uint256 plan2 = inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE + 1 days,
            0,
            keccak256("DIFFERENT_CODE")
        );
        vm.stopPrank();

        assertEq(plan1, 1);
        assertEq(plan2, 2);
        assertEq(inheritX.planCount(), 2);
        assertEq(inheritX.userPlanCount(user1), 2);
    }

    function test_PlanMapping() public {
        _createPlanForClaiming();

        uint256 globalPlanId = inheritX.userPlanIdToGlobal(user1, 1);
        assertEq(globalPlanId, 1);

        (address user, uint256 userPlanId) = inheritX.globalPlanIdToUser(1);
        UserPlanMapping memory planMapping = UserPlanMapping({
            user: user,
            userPlanId: userPlanId
        });
        assertEq(planMapping.user, user1);
        assertEq(planMapping.userPlanId, 1);
    }

    function test_FullLifecycle() public {
        // 1. Approve KYC
        vm.prank(admin);
        inheritX.approveKYC(user1, KYC_DATA_HASH);

        // 2. Create plan
        BeneficiaryInput[] memory beneficiaries = new BeneficiaryInput[](1);
        beneficiaries[0] = _createBeneficiaryInput(
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            10000
        );

        uint256 creationFee = inheritX.previewPlanCreationFee(PLAN_AMOUNT);
        uint256 totalRequired = PLAN_AMOUNT + creationFee;

        _approveAndFund(user1, totalRequired, address(primaryToken));

        vm.prank(user1);
        uint256 userPlanId = inheritX.createInheritancePlan(
            PLAN_NAME_HASH,
            PLAN_DESC_HASH,
            beneficiaries,
            uint8(AssetType.ERC20_TOKEN1),
            PLAN_AMOUNT,
            uint8(DistributionMethod.LumpSum),
            FUTURE_DATE,
            0,
            CLAIM_CODE_HASH
        );

        assertEq(userPlanId, 1);

        // 3. Pause plan
        vm.prank(user1);
        inheritX.pausePlan(1);

        // 4. Resume plan
        vm.prank(user1);
        inheritX.resumePlan(1);

        // 5. Fast forward and claim
        vm.warp(FUTURE_DATE);

        uint256 balanceBefore = IERC20(address(primaryToken)).balanceOf(beneficiary1);

        vm.prank(beneficiary1);
        inheritX.claimInheritance(
            1,
            CLAIM_CODE,
            BENEFICIARY_NAME,
            BENEFICIARY_EMAIL,
            BENEFICIARY_RELATIONSHIP,
            1
        );

        uint256 balanceAfter = IERC20(address(primaryToken)).balanceOf(beneficiary1);
        uint256 serviceFee = (PLAN_AMOUNT * 200) / 10000;
        assertEq(balanceAfter - balanceBefore, PLAN_AMOUNT - serviceFee);

        // 6. Verify plan is executed
        (
            uint256 id,
            address owner,
            uint8 beneficiaryCount,
            AssetType assetType,
            uint256 assetAmount,
            uint64 createdAt,
            uint64 transferDate,
            PlanStatus status,
            bool isClaimed,
            bytes32 claimCodeHash,
            uint256 escrowId
        ) = inheritX.inheritancePlans(1);
        InheritancePlan memory plan = InheritancePlan({
            id: id,
            owner: owner,
            beneficiaryCount: beneficiaryCount,
            assetType: assetType,
            assetAmount: assetAmount,
            createdAt: createdAt,
            transferDate: transferDate,
            status: status,
            isClaimed: isClaimed,
            claimCodeHash: claimCodeHash,
            escrowId: escrowId
        });
        assertEq(uint8(plan.status), uint8(PlanStatus.Executed));
        assertTrue(plan.isClaimed);
    }
}
