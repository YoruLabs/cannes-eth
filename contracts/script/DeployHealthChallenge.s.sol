// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";
import {MockWLDToken} from "../src/MockWLDToken.sol";

contract DeployHealthChallengeScript is Script {
    function setUp() public {}

    function run() public {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Mock WLD Token first
        MockWLDToken wldToken = new MockWLDToken();
        console.log("MockWLDToken deployed to:", address(wldToken));
        
        // Create a backend signer address (you should replace this with your actual backend signer)
        address backendSigner = vm.addr(deployerPrivateKey); // Using deployer as backend signer for demo
        console.log("Backend signer address:", backendSigner);
        
        // Deploy HealthChallengePool
        HealthChallengePool challengePool = new HealthChallengePool(
            address(wldToken),
            backendSigner
        );
        
        console.log("HealthChallengePool deployed to:", address(challengePool));
        console.log("WLD Token address:", address(wldToken));
        console.log("Backend signer:", challengePool.backendSigner());
        console.log("Owner:", challengePool.owner());
        
        // Get deployment and chain information
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);
        
        // Determine which network we're on
        if (chainId == 4801) {
            console.log("Network: World Chain Sepolia Testnet");
            console.log("HealthChallengePool Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", address(wldToken));
        } else if (chainId == 480) {
            console.log("Network: World Chain Mainnet");
            console.log("HealthChallengePool Explorer: https://worldscan.org/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldscan.org/address/%s", address(wldToken));
        } else {
            console.log("Network: Unknown (Chain ID: %s)", chainId);
        }
        
        // Example: Create a sample challenge (commented out for production)
        /*
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 8 days;
        uint256 entryFee = 10 * 10**18; // 10 WLD
        
        challengePool.createChallenge(
            "10K Steps Challenge",
            "Walk 10,000 steps daily for 7 days",
            "steps",
            entryFee,
            startTime,
            endTime
        );
        
        console.log("Sample challenge created with ID: 1");
        */
        
        // Stop broadcasting
        vm.stopBroadcast();
    }
} 