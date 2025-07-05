// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";
import {MockWLDToken} from "../src/MockWLDToken.sol";

contract DeployHealthChallengeWithTokenScript is Script {
    // Use the deployed MockWLDToken address on World Chain Sepolia
    address constant WLD_TOKEN_ADDRESS = 0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4;
    
    function setUp() public {}

    function run() public {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Use deployer as backend signer for demo (you should use a separate backend key in production)
        address backendSigner = vm.addr(deployerPrivateKey);
        
        // Deploy HealthChallengePool using existing WLD token
        HealthChallengePool challengePool = new HealthChallengePool(
            WLD_TOKEN_ADDRESS,
            backendSigner
        );
        
        console.log("=== HealthChallengePool Deployment ===");
        console.log("HealthChallengePool deployed to:", address(challengePool));
        console.log("Using WLD Token at:", WLD_TOKEN_ADDRESS);
        console.log("Backend signer:", challengePool.backendSigner());
        console.log("Owner:", challengePool.owner());
        console.log("Challenge counter:", challengePool.challengeCounter());
        
        // Verify WLD token connection
        MockWLDToken wldToken = MockWLDToken(WLD_TOKEN_ADDRESS);
        console.log("WLD Token name:", wldToken.name());
        console.log("WLD Token symbol:", wldToken.symbol());
        console.log("Deployer WLD balance:", wldToken.balanceOf(msg.sender));
        
        // Get deployment and chain information
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);
        
        // Determine which network we're on
        if (chainId == 4801) {
            console.log("Network: World Chain Sepolia Testnet");
            console.log("HealthChallengePool Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", WLD_TOKEN_ADDRESS);
        } else if (chainId == 480) {
            console.log("Network: World Chain Mainnet");
            console.log("HealthChallengePool Explorer: https://worldscan.org/address/%s", address(challengePool));
            console.log("WLD Token Explorer: https://worldscan.org/address/%s", WLD_TOKEN_ADDRESS);
        } else {
            console.log("Network: Unknown (Chain ID: %s)", chainId);
        }
        
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Add WLD token to MetaMask: %s", WLD_TOKEN_ADDRESS);
        console.log("2. Create challenges using the HealthChallengePool");
        console.log("3. Test the full challenge flow");
        
        // Stop broadcasting
        vm.stopBroadcast();
    }
} 