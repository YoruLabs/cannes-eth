// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";

contract FinishChallengeScript is Script {
    function setUp() public {}

    function run() public {
        // Get environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address challengePoolAddress = vm.envAddress("CHALLENGE_POOL_ADDRESS");
        uint256 challengeId = vm.envUint("CHALLENGE_ID");
        
        // Get the deployer address (who is also the backend signer)
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Get the contract instance
        HealthChallengePool challengePool = HealthChallengePool(challengePoolAddress);
        
        console.log("=== Finishing Challenge ===");
        console.log("Challenge Pool Address:", challengePoolAddress);
        console.log("Challenge ID:", challengeId);
        console.log("Deployer/Backend Signer:", deployerAddress);
        
        // Get challenge details before completion
        (
            uint256 id,
            uint256 entryFee,
            uint256 totalPool,
            uint256 participantCount,
            uint256 winnerCount,
            bool isActive,
            bool isCompleted
        ) = challengePool.getChallengeDetails(challengeId);
        
        console.log("=== Challenge Details Before Completion ===");
        console.log("ID:", id);
        console.log("Entry Fee (wei):", entryFee);
        console.log("Total Pool (wei):", totalPool);
        console.log("Participant Count:", participantCount);
        console.log("Winner Count:", winnerCount);
        console.log("Is Active:", isActive);
        console.log("Is Completed:", isCompleted);
        
        require(isActive, "Challenge is not active");
        require(!isCompleted, "Challenge is already completed");
        require(participantCount > 0, "No participants in challenge");
        
        // Get all participants
        address[] memory participants = challengePool.getChallengeParticipants(challengeId);
        console.log("=== Participants ===");
        for (uint256 i = 0; i < participants.length; i++) {
            console.log("Participant", i, ":", participants[i]);
        }
        
        // For demo purposes, make the first participant (or deployer if they joined) the winner
        address[] memory winners = new address[](1);
        winners[0] = participants[0]; // First participant wins
        
        console.log("=== Winner Selection ===");
        console.log("Selected Winner:", winners[0]);
        
        // Create the signature for the winners
        // The message is: keccak256(abi.encodePacked(challengeId, winners))
        bytes32 messageHash = keccak256(abi.encodePacked(challengeId, winners));
        
        // The contract uses MessageHashUtils.toEthSignedMessageHash, so we need to sign the Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Sign the Ethereum signed message hash (this simulates the backend signing)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(deployerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        console.log("=== Signature Details ===");
        console.log("Message Hash:");
        console.logBytes32(messageHash);
        console.log("Eth Signed Message Hash:");
        console.logBytes32(ethSignedMessageHash);
        console.log("Signature Length:", signature.length);
        
        // Complete the challenge
        challengePool.completeChallenge(challengeId, winners, signature);
        
        console.log("=== Challenge Completed Successfully ===");
        
        // Get challenge details after completion
        (
            id,
            entryFee,
            totalPool,
            participantCount,
            winnerCount,
            isActive,
            isCompleted
        ) = challengePool.getChallengeDetails(challengeId);
        
        console.log("=== Challenge Details After Completion ===");
        console.log("ID:", id);
        console.log("Entry Fee (wei):", entryFee);
        console.log("Total Pool (wei):", totalPool);
        console.log("Participant Count:", participantCount);
        console.log("Winner Count:", winnerCount);
        console.log("Is Active:", isActive);
        console.log("Is Completed:", isCompleted);
        
        // Calculate prize per winner
        uint256 prizePerWinner = totalPool / winnerCount;
        console.log("Prize per winner (wei):", prizePerWinner);
        console.log("Prize per winner (WLD):", prizePerWinner / 1e18);
        
        vm.stopBroadcast();
    }
} 