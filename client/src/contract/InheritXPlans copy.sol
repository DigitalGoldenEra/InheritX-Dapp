// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./InheritXCore.sol";

contract InheritXPlans is InheritXCore {
    uint256 public constant PLAN_CREATION_FEE_BPS = 500; // 5%
    uint256 private constant BPS_DENOMINATOR = 10_000;

    mapping(uint256 => DistributionPlan) public distributionPlans;
    mapping(uint256 => DistributionConfig) public distributionConfigs;

    mapping(uint256 => string) public planNames;
    mapping(uint256 => string) public planDescriptions;

    mapping(address => uint256) public userPlanIdCounter;
    mapping(address => mapping(uint256 => uint256)) public userPlanIdToGlobal;
    mapping(uint256 => UserPlanMapping) public globalPlanIdToUser;

    struct UserPlanMapping {
        address user;
        uint256 userPlanId;
    }

    /**
     * @notice Creates a new inheritance plan with distribution method
     */
    function createInheritancePlan(
        string calldata planName,
        string calldata planDescription,
        BeneficiaryInput[] calldata beneficiaries,
        uint8 assetType,
        uint256 assetAmount,
        uint8 distributionMethod,
        uint64 lumpSumDate,
        uint8 quarterlyPercentage,
        uint8 yearlyPercentage,
        uint8 monthlyPercentage,
        string calldata additionalNote,
        string calldata claimCode
    ) external whenNotPaused returns (uint256) {
        if (bytes(planName).length == 0) revert InvalidInput();
        if (bytes(planDescription).length == 0) revert InvalidInput();
        if (bytes(claimCode).length != 6) revert InvalidInput();
        if (assetAmount == 0) revert InvalidInput();

        _validateBeneficiaryInputs(beneficiaries);
        _validateDistributionConfig(
            distributionMethod,
            lumpSumDate,
            quarterlyPercentage,
            yearlyPercentage,
            monthlyPercentage
        );

        address tokenAddress = _getTokenAddress(assetType);
        IERC20 token = IERC20(tokenAddress);

        address feeRecipient = feeConfig.feeRecipient;
        if (feeRecipient == address(0)) revert ZeroAddress();

        uint256 totalRequired = assetAmount + _calculatePlanCreationFee(assetAmount);

        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < totalRequired) {
            revert InsufficientAllowance(totalRequired, allowance);
        }

        uint256 balance = token.balanceOf(msg.sender);
        if (balance < totalRequired) {
            revert InsufficientUserBalance(msg.sender, totalRequired, balance);
        }

        (uint256 feeAmount, uint256 netAmount) = _calculateFee(assetAmount);
        if (netAmount == 0) revert InvalidInput();

        if (!token.transferFrom(msg.sender, address(this), totalRequired)) {
            revert TransferFailed();
        }

        {
            uint256 creationFee = _calculatePlanCreationFee(assetAmount);
            if (creationFee > 0 && !token.transfer(feeRecipient, creationFee)) {
                revert TransferFailed();
            }
        }

        if (feeAmount > 0 && !token.transfer(feeRecipient, feeAmount)) {
            revert TransferFailed();
        }

        uint256 globalPlanId = ++planCount;
        uint256 userPlanId = ++userPlanIdCounter[msg.sender];
        uint256 escrowId = ++escrowCount;

        userPlanIdToGlobal[msg.sender][userPlanId] = globalPlanId;
        globalPlanIdToUser[globalPlanId] = UserPlanMapping({
            user: msg.sender,
            userPlanId: userPlanId
        });

        bytes32 claimCodeHash = keccak256(abi.encodePacked(claimCode));

        inheritancePlans[globalPlanId] = InheritancePlan({
            id: globalPlanId,
            owner: msg.sender,
            beneficiaryCount: uint8(beneficiaries.length),
            assetType: AssetType(assetType),
            assetAmount: netAmount,
            nftTokenId: 0,
            nftContract: address(0),
            timeframe: 0,
            createdAt: uint64(block.timestamp),
            becomesActiveAt: uint64(block.timestamp),
            guardian: address(0),
            encryptedDetails: "",
            status: PlanStatus.Active,
            isClaimed: false,
            claimCodeHash: claimCodeHash,
            inactivityThreshold: 0,
            lastActivity: uint64(block.timestamp),
            swapRequestId: 0,
            escrowId: escrowId,
            securityLevel: 1,
            autoExecute: false,
            emergencyContactsCount: 0
        });

        planNames[globalPlanId] = planName;
        planDescriptions[globalPlanId] = planDescription;

        planBeneficiaryCount[globalPlanId] = beneficiaries.length;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            uint256 beneficiaryIndex = i + 1;
            planBeneficiaries[globalPlanId][beneficiaryIndex] = Beneficiary({
                beneficiaryAddress: address(0),
                name: beneficiaries[i].name,
                email: beneficiaries[i].email,
                relationship: beneficiaries[i].relationship,
                claimCodeHash: claimCodeHash,
                hasClaimed: false,
                claimedAmount: 0
            });
        }

        escrowAccounts[escrowId] = EscrowAccount({
            id: escrowId,
            planId: globalPlanId,
            assetType: AssetType(assetType),
            amount: netAmount,
            nftTokenId: 0,
            nftContract: address(0),
            isLocked: false,
            lockedAt: 0,
            beneficiary: address(0),
            releaseConditionsCount: 0,
            fees: feeAmount,
            taxLiability: 0,
            lastValuation: uint64(block.timestamp),
            valuationPrice: 0
        });

        planEscrow[globalPlanId] = escrowId;
        uint256 totalFeesForPlan = feeAmount + _calculatePlanCreationFee(assetAmount);
        totalFeesCollected += totalFeesForPlan;
        planFeesCollected[globalPlanId] = totalFeesForPlan;

        _createDistributionConfig(
            globalPlanId,
            msg.sender,
            distributionMethod,
            lumpSumDate,
            quarterlyPercentage,
            yearlyPercentage,
            monthlyPercentage,
            additionalNote,
            netAmount,
            uint8(beneficiaries.length)
        );

        userPlanCount[msg.sender] += 1;

        emit FeeCollected(
            userPlanId,
            address(0),
            feeAmount,
            feeConfig.feePercentage,
            assetAmount,
            netAmount,
            feeRecipient,
            uint64(block.timestamp)
        );

        emit PlanCreated(
            userPlanId,
            msg.sender,
            planName,
            planDescription,
            beneficiaries[0].name,
            beneficiaries[0].relationship,
            beneficiaries[0].email,
            assetType,
            netAmount,
            distributionMethod,
            uint64(block.timestamp)
        );

        return userPlanId;
    }

    function previewPlanCreationFee(uint256 assetAmount) public pure returns (uint256) {
        return _calculatePlanCreationFee(assetAmount);
    }

    function _calculatePlanCreationFee(uint256 assetAmount) internal pure returns (uint256) {
        if (assetAmount == 0) {
            return 0;
        }
        return (assetAmount * PLAN_CREATION_FEE_BPS) / BPS_DENOMINATOR;
    }

    function _createDistributionConfig(
        uint256 planId,
        address owner,
        uint8 distributionMethod,
        uint64 lumpSumDate,
        uint8 quarterlyPercentage,
        uint8 yearlyPercentage,
        uint8 monthlyPercentage,
        string calldata additionalNote,
        uint256 netAmount,
        uint8 beneficiariesCount
    ) internal {
        DistributionMethod method = DistributionMethod(distributionMethod);
        uint64 currentTime = uint64(block.timestamp);

        DistributionConfig storage config = distributionConfigs[planId];
        config.distributionMethod = method;
        config.lumpSumDate = lumpSumDate;
        config.quarterlyPercentage = quarterlyPercentage;
        config.yearlyPercentage = yearlyPercentage;
        config.monthlyPercentage = monthlyPercentage;
        config.additionalNote = additionalNote;

        uint256 periodAmount = netAmount;
        uint8 totalPeriods = 1;
        uint64 nextDisbursementDate = lumpSumDate;
        uint64 startDate = currentTime;
        uint64 endDate = lumpSumDate;

        if (method == DistributionMethod.LumpSum) {
            startDate = lumpSumDate;
            endDate = lumpSumDate;
            nextDisbursementDate = lumpSumDate;
        } else {
            uint8 percentage;
            uint64 periodLength;

            if (method == DistributionMethod.Quarterly) {
                percentage = quarterlyPercentage;
                periodLength = 90 days;
            } else if (method == DistributionMethod.Yearly) {
                percentage = yearlyPercentage;
                periodLength = 365 days;
            } else {
                percentage = monthlyPercentage;
                periodLength = 30 days;
            }

            if (percentage == 0) revert InvalidPercentage(percentage);

            uint8 candidatePeriods = uint8(100 / percentage);
            if (candidatePeriods == 0) revert InvalidInput();
            uint256 accumulated = uint256(percentage) * candidatePeriods;
            if (accumulated != 100) {
                revert InvalidPercentageSum(uint8(accumulated));
            }

            totalPeriods = candidatePeriods;
            periodAmount = (netAmount * percentage) / 100;
            if (periodAmount == 0) revert InvalidInput();

            startDate = currentTime;
            nextDisbursementDate = currentTime + periodLength;
            endDate = currentTime + periodLength * totalPeriods;
        }

        config.startDate = startDate;
        config.endDate = endDate;

        DistributionPlan storage plan = distributionPlans[planId];
        plan.planId = planId;
        plan.owner = owner;
        plan.totalAmount = netAmount;
        plan.distributionMethod = method;
        plan.periodAmount = periodAmount;
        plan.startDate = startDate;
        plan.endDate = endDate;
        plan.totalPeriods = totalPeriods;
        plan.completedPeriods = 0;
        plan.nextDisbursementDate = nextDisbursementDate;
        plan.isActive = true;
        plan.beneficiariesCount = beneficiariesCount;
        plan.disbursementStatus = DisbursementStatus.Pending;
        plan.createdAt = currentTime;
        plan.lastActivity = currentTime;
        plan.pausedAt = 0;
        plan.resumedAt = 0;
    }
}

