// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockWLDToken} from "../src/MockWLDToken.sol";

contract DeployMockWLDScript is Script {
    function setUp() public {}

    function run() public {
        // Get the private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Mock WLD Token
        MockWLDToken wldToken = new MockWLDToken();
        
        console.log("=== MockWLDToken Deployment ===");
        console.log("MockWLDToken deployed to:", address(wldToken));
        console.log("Token name:", wldToken.name());
        console.log("Token symbol:", wldToken.symbol());
        console.log("Total supply:", wldToken.totalSupply());
        console.log("Owner:", wldToken.owner());
        console.log("Deployer balance:", wldToken.balanceOf(msg.sender));
        
        // Get deployment and chain information
        uint256 chainId = block.chainid;
        console.log("Chain ID:", chainId);
        
        // Determine which network we're on
        if (chainId == 4801) {
            console.log("Network: World Chain Sepolia Testnet");
            console.log("Block Explorer: https://worldchain-sepolia.explorer.alchemy.com/address/%s", address(wldToken));
        } else if (chainId == 480) {
            console.log("Network: World Chain Mainnet");
            console.log("Block Explorer: https://worldscan.org/address/%s", address(wldToken));
        } else {
            console.log("Network: Unknown (Chain ID: %s)", chainId);
        }
        
        // Stop broadcasting
        vm.stopBroadcast();
    }
} 