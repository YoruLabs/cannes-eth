// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/HealthChallengePool.sol";
import "../src/MockWLDToken.sol";

contract HealthChallengePoolTest is Test {
    HealthChallengePool public pool;
    MockWLDToken public wldToken;
    
    address public owner = address(0x1);
    address public backendSigner;
    uint256 public backendSignerPrivateKey = 0x2;
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public user3 = address(0x5);
    
    uint256 public constant ENTRY_FEE = 1 ether; // 1 WLD
    uint256 public constant INITIAL_BALANCE = 1000 ether; // 1000 WLD per user
    
    function setUp() public {
        // Generate backend signer from private key
        backendSigner = vm.addr(backendSignerPrivateKey);
        
        // Deploy contracts as owner
        vm.startPrank(owner);
        wldToken = new MockWLDToken();
        pool = new HealthChallengePool(address(wldToken), backendSigner);
        vm.stopPrank();
        
        // Mint tokens to users
        vm.startPrank(owner);
        wldToken.mint(user1, INITIAL_BALANCE);
        wldToken.mint(user2, INITIAL_BALANCE);
        wldToken.mint(user3, INITIAL_BALANCE);
        vm.stopPrank();
        
        // Approve pool to spend tokens
        vm.prank(user1);
        wldToken.approve(address(pool), type(uint256).max);
        
        vm.prank(user2);
        wldToken.approve(address(pool), type(uint256).max);
        
        vm.prank(user3);
        wldToken.approve(address(pool), type(uint256).max);
    }
    
    function testCreateChallenge() public {
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        (
            uint256 id,
            uint256 entryFee,
            uint256 totalPool,
            uint256 participantCount,
            uint256 winnerCount,
            bool isActive,
            bool isCompleted
        ) = pool.getChallengeDetails(1);
        
        assertEq(id, 1);
        assertEq(entryFee, ENTRY_FEE);
        assertEq(totalPool, 0);
        assertEq(participantCount, 0);
        assertEq(winnerCount, 0);
        assertTrue(isActive);
        assertFalse(isCompleted);
    }
    
    function testCreateChallengeOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pool.createChallenge(ENTRY_FEE);
    }
    
    function testCreateChallengeZeroFee() public {
        vm.prank(owner);
        vm.expectRevert("Entry fee must be greater than 0");
        pool.createChallenge(0);
    }
    
    function testJoinChallenge() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        uint256 initialBalance = wldToken.balanceOf(user1);
        
        // Join challenge
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Check user balance decreased
        assertEq(wldToken.balanceOf(user1), initialBalance - ENTRY_FEE);
        
        // Check challenge state
        (
            ,
            ,
            uint256 totalPool,
            uint256 participantCount,
            ,
            ,
        ) = pool.getChallengeDetails(1);
        
        assertEq(totalPool, ENTRY_FEE);
        assertEq(participantCount, 1);
        
        // Check participant status
        assertTrue(pool.isParticipant(1, user1));
        
        // Check participant list
        address[] memory participants = pool.getChallengeParticipants(1);
        assertEq(participants.length, 1);
        assertEq(participants[0], user1);
        
        // Check user challenge history
        uint256[] memory userChallenges = pool.getUserChallenges(user1);
        assertEq(userChallenges.length, 1);
        assertEq(userChallenges[0], 1);
    }
    
    function testJoinChallengeMultipleUsers() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        // Multiple users join
        vm.prank(user1);
        pool.joinChallenge(1);
        
        vm.prank(user2);
        pool.joinChallenge(1);
        
        vm.prank(user3);
        pool.joinChallenge(1);
        
        // Check challenge state
        (
            ,
            ,
            uint256 totalPool,
            uint256 participantCount,
            ,
            ,
        ) = pool.getChallengeDetails(1);
        
        assertEq(totalPool, ENTRY_FEE * 3);
        assertEq(participantCount, 3);
        
        // Check all are participants
        assertTrue(pool.isParticipant(1, user1));
        assertTrue(pool.isParticipant(1, user2));
        assertTrue(pool.isParticipant(1, user3));
        
        // Check participant list
        address[] memory participants = pool.getChallengeParticipants(1);
        assertEq(participants.length, 3);
    }
    
    function testJoinChallengeAlreadyJoined() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        // Join challenge
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Try to join again
        vm.prank(user1);
        vm.expectRevert("Already joined this challenge");
        pool.joinChallenge(1);
    }
    
    function testJoinInactiveChallenge() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        // Cancel challenge
        vm.prank(owner);
        pool.cancelChallenge(1);
        
        // Try to join cancelled challenge
        vm.prank(user1);
        vm.expectRevert("Challenge is not active");
        pool.joinChallenge(1);
    }
    
    function testJoinCompletedChallenge() public {
        // Create challenge and have users join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Complete challenge
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        pool.completeChallenge(1, winners, signature);
        
        // Try to join completed challenge
        vm.prank(user2);
        vm.expectRevert("Challenge is already completed");
        pool.joinChallenge(1);
    }
    
    function testJoinNonexistentChallenge() public {
        vm.prank(user1);
        vm.expectRevert("Challenge is not active");
        pool.joinChallenge(999);
    }
    
    function testCompleteChallenge() public {
        // Create challenge and have users join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        vm.prank(user2);
        pool.joinChallenge(1);
        
        uint256 initialBalance1 = wldToken.balanceOf(user1);
        uint256 initialBalance2 = wldToken.balanceOf(user2);
        
        // Complete challenge with both users as winners
        address[] memory winners = new address[](2);
        winners[0] = user1;
        winners[1] = user2;
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        pool.completeChallenge(1, winners, signature);
        
        // Check challenge state
        (
            ,
            ,
            ,
            ,
            uint256 winnerCount,
            bool isActive,
            bool isCompleted
        ) = pool.getChallengeDetails(1);
        
        assertEq(winnerCount, 2);
        assertTrue(isActive);
        assertTrue(isCompleted);
        
        // Check winners received prizes
        uint256 prizePerWinner = ENTRY_FEE; // 2 WLD total pool / 2 winners = 1 WLD each
        assertEq(wldToken.balanceOf(user1), initialBalance1 + prizePerWinner);
        assertEq(wldToken.balanceOf(user2), initialBalance2 + prizePerWinner);
        
        // Check winner status
        assertTrue(pool.isWinner(1, user1));
        assertTrue(pool.isWinner(1, user2));
        
        // Check winner list
        address[] memory winnerList = pool.getChallengeWinners(1);
        assertEq(winnerList.length, 2);
        assertEq(winnerList[0], user1);
        assertEq(winnerList[1], user2);
    }
    
    function testCompleteChallengeInvalidSignature() public {
        // Create challenge and have user join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Try to complete with invalid signature
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        bytes memory invalidSignature = abi.encodePacked(bytes32(0), bytes32(0), uint8(0));
        
        vm.expectRevert(); // Just expect any revert for invalid signature
        pool.completeChallenge(1, winners, invalidSignature);
    }
    
    function testCompleteChallengeNonParticipantWinner() public {
        // Create challenge and have user join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Try to complete with non-participant as winner
        address[] memory winners = new address[](1);
        winners[0] = user2; // user2 didn't join
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert("Winner not a participant");
        pool.completeChallenge(1, winners, signature);
    }
    
    function testCompleteChallengeAlreadyCompleted() public {
        // Create challenge and have user join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Complete challenge
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        pool.completeChallenge(1, winners, signature);
        
        // Try to complete again
        vm.expectRevert("Challenge already completed");
        pool.completeChallenge(1, winners, signature);
    }
    
    function testCompleteChallengeNoWinners() public {
        // Create challenge and have user join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Try to complete with no winners
        address[] memory winners = new address[](0);
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert("No winners provided");
        pool.completeChallenge(1, winners, signature);
    }
    
    function testCompleteChallengeInactiveChallenge() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        // Cancel challenge
        vm.prank(owner);
        pool.cancelChallenge(1);
        
        // Try to complete cancelled challenge
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert("Challenge is not active");
        pool.completeChallenge(1, winners, signature);
    }
    
    function testCancelChallenge() public {
        // Create challenge and have users join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        vm.prank(user2);
        pool.joinChallenge(1);
        
        uint256 initialBalance1 = wldToken.balanceOf(user1);
        uint256 initialBalance2 = wldToken.balanceOf(user2);
        
        // Cancel challenge
        vm.prank(owner);
        pool.cancelChallenge(1);
        
        // Check challenge is inactive
        (
            ,
            ,
            ,
            ,
            ,
            bool isActive,
            bool isCompleted
        ) = pool.getChallengeDetails(1);
        
        assertFalse(isActive);
        assertFalse(isCompleted);
        
        // Check users got refunded
        assertEq(wldToken.balanceOf(user1), initialBalance1 + ENTRY_FEE);
        assertEq(wldToken.balanceOf(user2), initialBalance2 + ENTRY_FEE);
    }
    
    function testCancelChallengeOnlyOwner() public {
        // Create challenge
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        // Try to cancel as non-owner
        vm.prank(user1);
        vm.expectRevert();
        pool.cancelChallenge(1);
    }
    
    function testCancelCompletedChallenge() public {
        // Create challenge and have user join
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(user1);
        pool.joinChallenge(1);
        
        // Complete challenge
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        pool.completeChallenge(1, winners, signature);
        
        // Try to cancel completed challenge
        vm.prank(owner);
        vm.expectRevert("Challenge already completed");
        pool.cancelChallenge(1);
    }
    
    function testUpdateBackendSigner() public {
        address newSigner = address(0x999);
        
        vm.prank(owner);
        pool.updateBackendSigner(newSigner);
        
        assertEq(pool.backendSigner(), newSigner);
    }
    
    function testUpdateBackendSignerOnlyOwner() public {
        address newSigner = address(0x999);
        
        vm.prank(user1);
        vm.expectRevert();
        pool.updateBackendSigner(newSigner);
    }
    
    function testUpdateBackendSignerZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid signer address");
        pool.updateBackendSigner(address(0));
    }
    
    function testMultipleChallenges() public {
        // Create multiple challenges
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE);
        
        vm.prank(owner);
        pool.createChallenge(ENTRY_FEE * 2);
        
        // Check challenge counter
        assertEq(pool.challengeCounter(), 2);
        
        // Check challenge details
        (uint256 id1, uint256 entryFee1, , , , , ) = pool.getChallengeDetails(1);
        (uint256 id2, uint256 entryFee2, , , , , ) = pool.getChallengeDetails(2);
        
        assertEq(id1, 1);
        assertEq(entryFee1, ENTRY_FEE);
        assertEq(id2, 2);
        assertEq(entryFee2, ENTRY_FEE * 2);
        
        // Users can join different challenges
        vm.prank(user1);
        pool.joinChallenge(1);
        
        vm.prank(user1);
        pool.joinChallenge(2);
        
        // Check user challenge history
        uint256[] memory userChallenges = pool.getUserChallenges(user1);
        assertEq(userChallenges.length, 2);
        assertEq(userChallenges[0], 1);
        assertEq(userChallenges[1], 2);
    }
} 