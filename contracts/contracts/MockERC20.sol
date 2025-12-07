// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing purposes
 * @dev This contract is for testing only - DO NOT use in production
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;

    /**
     * @notice Creates a new mock ERC20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param decimals_ Number of decimals
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    /**
     * @notice Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mints tokens to a specified address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens from caller's balance
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Allows anyone to mint tokens (for testing faucet)
     * @dev Remove this in production!
     * @param amount Amount to mint (max 10000 tokens per call)
     */
    function faucet(uint256 amount) external {
        require(amount <= 10000 * (10 ** _decimals), "Max 10000 tokens per faucet call");
        _mint(msg.sender, amount);
    }
}

