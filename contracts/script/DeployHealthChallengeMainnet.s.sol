// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";

contract DeployHealthChallengeMainnetScript is Script {
    // Real WLD token address on World Chain mainnet
    address constant WLD_TOKEN_ADDRESS = 0x2cFc85d8E48F8EAB294be644d9E25C3030863003;
    
    function setUp() public {}

    function run() public {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Use deployer as backend signer for demo (you should use a separate backend key in production)
        address backendSigner = vm.addr(deployerPrivateKey);
        
        // Deploy HealthChallengePool using real WLD token
        HealthChallengePool challengePool = new HealthChallengePool(
            WLD_TOKEN_ADDRESS,
            backendSigner
        );
        
        console.log("=== HealthChallengePool Mainnet Deployment ===");
        console.log("HealthChallengePool deployed to:", address(challengePool));
        console.log("Using WLD Token at:", WLD_TOKEN_ADDRESS);
        console.log("Backend signer:", challengePool.backendSigner());
        console.log("Owner:", challengePool.owner());
        console.log("Challenge counter:", challengePool.challengeCounter());
        
        // Get deployment and chain information
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);
        
        // Determine which network we're on
        if (chainId == 480) {
            console.log("Network: World Chain Mainnet");
            console.log("HealthChallengePool Explorer: https://worldscan.org/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldscan.org/address/%s", WLD_TOKEN_ADDRESS);
        } else if (chainId == 4801) {
            console.log("Network: World Chain Sepolia Testnet");
            console.log("HealthChallengePool Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", WLD_TOKEN_ADDRESS);
        } else {
            console.log("Network: Unknown (Chain ID: %s)", chainId);
        }
        
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("Contract Address: %s", address(challengePool));
        console.log("WLD Token: %s", WLD_TOKEN_ADDRESS);
        console.log("Backend Signer: %s", backendSigner);
        console.log("Deployer: %s", msg.sender);
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Verify the WLD token address is correct");
        console.log("2. Update frontend configuration with new contract address");
        console.log("3. Test the challenge creation and completion flow");
        console.log("4. Consider setting up a proper backend signer (separate from deployer)");
        
        // Stop broadcasting
        vm.stopBroadcast();
    }
} 