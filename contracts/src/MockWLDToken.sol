// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWLDToken
 * @dev Mock WLD token for testing the HealthChallengePool contract
 */
contract MockWLDToken is ERC20, Ownable {
    constructor() ERC20("Worldcoin", "WLD") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**18); // 1M WLD tokens
    }
    
    /**
     * @dev Mint tokens to an address (for testing purposes)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Mint tokens to multiple addresses (for testing)
     */
    function mintToMultiple(address[] calldata recipients, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }
} 