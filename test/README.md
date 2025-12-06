# InheritX Foundry Test Suite

Comprehensive test suite for the InheritX smart contract covering all functionality, edge cases, and error conditions.

## Test Coverage

### ✅ Initialization Tests
- Contract initialization
- Zero address validation
- Re-initialization protection

### ✅ KYC Tests
- Approve KYC (with and without hash)
- Reject KYC
- KYC status checks
- Access control
- Edge cases (zero address, double approval)

### ✅ Plan Creation Tests
- All asset types (ERC20_TOKEN1, ERC20_TOKEN2, ERC20_TOKEN3)
- All distribution methods (LumpSum, Monthly, Quarterly, Yearly)
- Single and multiple beneficiaries
- Maximum beneficiaries (10)
- All validation checks:
  - KYC requirement
  - Zero values
  - Invalid dates
  - Invalid percentages
  - Invalid asset types
  - Insufficient allowance/balance
  - Invalid distribution methods
  - Invalid periodic percentages

### ✅ Fee Calculation Tests
- Plan creation fee (5%)
- Service fee (2%)
- Fee collection and distribution
- Zero amount handling

### ✅ Claim Tests
- Successful claims
- Invalid claim codes
- Invalid beneficiary data
- Invalid beneficiary index
- Transfer date validation
- Already claimed protection
- Multiple beneficiaries claiming
- Plan execution after all claims

### ✅ Plan Management Tests
- Pause plan
- Resume plan
- Cancel plan
- Access control
- State validation

### ✅ Admin Functions Tests
- Update fee configuration
- Update token addresses
- Pause/unpause contract
- Access control
- Validation checks

### ✅ View Functions Tests
- Get user plans
- Get plan beneficiaries
- Verify beneficiary data
- Verify claim code
- Check claimable status
- Time until claimable

### ✅ Edge Cases & Integration Tests
- Multiple plans per user
- Plan ID mapping
- Full lifecycle (create → pause → resume → claim)
- Different token decimals

## Running Tests

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts
```

### Run All Tests

```bash
forge test
```

### Run Specific Test

```bash
forge test --match-test test_CreatePlan_PrimaryToken_LumpSum
```

### Run with Verbose Output

```bash
forge test -vvv
```

### Run with Gas Reporting

```bash
forge test --gas-report
```

### Run Specific Test Contract

```bash
forge test --match-contract InheritXTest
```

### Coverage Report

```bash
forge coverage
```

## Test Structure

```
test/
└── InheritX.t.sol          # Main test file
    ├── Setup                # Contract deployment and initialization
    ├── Helper Functions     # Reusable test utilities
    ├── Initialization       # Contract setup tests
    ├── KYC                  # KYC functionality tests
    ├── Plan Creation        # Plan creation with all validations
    ├── Fees                 # Fee calculation and collection
    ├── Claims               # Inheritance claiming tests
    ├── Plan Management      # Pause, resume, cancel
    ├── Admin Functions      # Admin-only operations
    ├── View Functions       # Read-only function tests
    └── Integration          # End-to-end scenarios
```

## Test Statistics

- **Total Tests**: 80+ test cases
- **Coverage**: All public/external functions
- **Edge Cases**: Comprehensive validation testing
- **Error Conditions**: All custom errors tested

## Key Test Scenarios

1. **Full Lifecycle**: Create plan → Pause → Resume → Claim
2. **Multiple Beneficiaries**: 2-10 beneficiaries with different allocations
3. **All Asset Types**: Primary token, USDT, USDC
4. **All Distribution Methods**: LumpSum, Monthly, Quarterly, Yearly
5. **Fee Calculations**: Creation fee (5%) + Service fee (2%)
6. **Access Control**: Admin, user, and unauthorized access
7. **State Management**: All plan status transitions
8. **Error Handling**: All custom errors and revert conditions

## Notes

- Tests use mock ERC20 tokens for all asset types
- Time manipulation (`vm.warp`) for testing time-based functions
- Role-based access control testing with `vm.prank`
- Comprehensive event emission testing
- Gas optimization verification
