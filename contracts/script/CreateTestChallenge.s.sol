// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";

contract CreateTestChallengeScript is Script {
    function setUp() public {}

    function run() public {
        // Get environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address challengePoolAddress = vm.envAddress("CHALLENGE_POOL_ADDRESS");
        uint256 entryFeeWei = vm.envUint("ENTRY_FEE_WEI"); // Already in wei
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Get the contract instance
        HealthChallengePool challengePool = HealthChallengePool(challengePoolAddress);
        
        console.log("=== Creating Test Challenge ===");
        console.log("Challenge Pool Address:", challengePoolAddress);
        console.log("Entry Fee (wei):", entryFeeWei);
        
        // Create the challenge
        challengePool.createChallenge(entryFeeWei);
        
        // Get the new challenge counter
        uint256 challengeCounter = challengePool.challengeCounter();
        
        console.log("=== Challenge Created Successfully ===");
        console.log("New Challenge ID:", challengeCounter);
        console.log("Total Challenges:", challengeCounter);
        
        vm.stopBroadcast();
    }
} 