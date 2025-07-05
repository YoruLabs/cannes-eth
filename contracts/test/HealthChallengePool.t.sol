// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {HealthChallengePool} from "../src/HealthChallengePool.sol";
import {MockWLDToken} from "../src/MockWLDToken.sol";

contract HealthChallengePoolTest is Test {
    HealthChallengePool public challengePool;
    MockWLDToken public wldToken;
    
    address public owner;
    address public backendSigner;
    address public user1;
    address public user2;
    address public user3;
    
    uint256 public backendSignerPrivateKey;
    
    // Challenge parameters
    string constant CHALLENGE_NAME = "10K Steps Challenge";
    string constant CHALLENGE_DESCRIPTION = "Walk 10,000 steps daily for 7 days";
    string constant CHALLENGE_TYPE = "steps";
    uint256 constant ENTRY_FEE = 10 * 10**18; // 10 WLD
    uint256 constant START_TIME_OFFSET = 1 hours;
    uint256 constant END_TIME_OFFSET = 8 days;
    
    event ChallengeCreated(
        uint256 indexed challengeId,
        string name,
        string challengeType,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime
    );
    
    event UserJoinedChallenge(
        uint256 indexed challengeId,
        address indexed user,
        uint256 amount
    );
    
    event ChallengeCompleted(
        uint256 indexed challengeId,
        uint256 winnerCount,
        uint256 prizePerWinner
    );
    
    function setUp() public {
        owner = address(this);
        
        // Create backend signer
        backendSignerPrivateKey = 0x1234567890123456789012345678901234567890123456789012345678901234;
        backendSigner = vm.addr(backendSignerPrivateKey);
        
        // Create test users
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Deploy contracts
        wldToken = new MockWLDToken();
        challengePool = new HealthChallengePool(address(wldToken), backendSigner);
        
        // Mint tokens to users
        address[] memory users = new address[](3);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        wldToken.mintToMultiple(users, 1000 * 10**18); // 1000 WLD each
        
        // Approve spending for users
        vm.prank(user1);
        wldToken.approve(address(challengePool), type(uint256).max);
        
        vm.prank(user2);
        wldToken.approve(address(challengePool), type(uint256).max);
        
        vm.prank(user3);
        wldToken.approve(address(challengePool), type(uint256).max);
    }
    
    function testDeployment() public {
        assertEq(address(challengePool.wldToken()), address(wldToken));
        assertEq(challengePool.backendSigner(), backendSigner);
        assertEq(challengePool.owner(), owner);
        assertEq(challengePool.challengeCounter(), 0);
    }
    
    function testCreateChallenge() public {
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        vm.expectEmit(true, true, true, true);
        emit ChallengeCreated(1, CHALLENGE_NAME, CHALLENGE_TYPE, ENTRY_FEE, startTime, endTime);
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        assertEq(challengePool.challengeCounter(), 1);
        
        // Check challenge details
        (
            uint256 id,
            string memory name,
            string memory description,
            string memory challengeType,
            uint256 entryFee,
            uint256 startTimeReturned,
            uint256 endTimeReturned,
            uint256 totalPool,
            uint256 participantCount,
            bool isActive,
            bool isCompleted,
            uint256 winnerCount
        ) = challengePool.getChallengeDetails(1);
        
        assertEq(id, 1);
        assertEq(name, CHALLENGE_NAME);
        assertEq(description, CHALLENGE_DESCRIPTION);
        assertEq(challengeType, CHALLENGE_TYPE);
        assertEq(entryFee, ENTRY_FEE);
        assertEq(startTimeReturned, startTime);
        assertEq(endTimeReturned, endTime);
        assertEq(totalPool, 0);
        assertEq(participantCount, 0);
        assertTrue(isActive);
        assertFalse(isCompleted);
        assertEq(winnerCount, 0);
    }
    
    function testCreateChallengeFailsForNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            block.timestamp + START_TIME_OFFSET,
            block.timestamp + END_TIME_OFFSET
        );
    }
    
    function testJoinChallenge() public {
        // Create challenge
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        uint256 user1BalanceBefore = wldToken.balanceOf(user1);
        uint256 contractBalanceBefore = wldToken.balanceOf(address(challengePool));
        
        vm.expectEmit(true, true, true, true);
        emit UserJoinedChallenge(1, user1, ENTRY_FEE);
        
        vm.prank(user1);
        challengePool.joinChallenge(1);
        
        // Check balances
        assertEq(wldToken.balanceOf(user1), user1BalanceBefore - ENTRY_FEE);
        assertEq(wldToken.balanceOf(address(challengePool)), contractBalanceBefore + ENTRY_FEE);
        
        // Check challenge state
        assertTrue(challengePool.isParticipant(1, user1));
        assertFalse(challengePool.isWinner(1, user1));
        
        // Check updated challenge details
        (, , , , , , , uint256 totalPool, uint256 participantCount, , ,) = challengePool.getChallengeDetails(1);
        assertEq(totalPool, ENTRY_FEE);
        assertEq(participantCount, 1);
        
        // Check participant list
        address[] memory participants = challengePool.getChallengeParticipants(1);
        assertEq(participants.length, 1);
        assertEq(participants[0], user1);
    }
    
    function testJoinChallengeMultipleUsers() public {
        // Create challenge
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        // User1 joins
        vm.prank(user1);
        challengePool.joinChallenge(1);
        
        // User2 joins
        vm.prank(user2);
        challengePool.joinChallenge(1);
        
        // User3 joins
        vm.prank(user3);
        challengePool.joinChallenge(1);
        
        // Check challenge state
        (, , , , , , , uint256 totalPool, uint256 participantCount, , ,) = challengePool.getChallengeDetails(1);
        assertEq(totalPool, ENTRY_FEE * 3);
        assertEq(participantCount, 3);
        
        // Check all participants
        assertTrue(challengePool.isParticipant(1, user1));
        assertTrue(challengePool.isParticipant(1, user2));
        assertTrue(challengePool.isParticipant(1, user3));
        
        address[] memory participants = challengePool.getChallengeParticipants(1);
        assertEq(participants.length, 3);
    }
    
    function testJoinChallengeFailsAfterStart() public {
        // Create challenge
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        // Fast forward past start time
        vm.warp(startTime + 1);
        
        vm.prank(user1);
        vm.expectRevert("Challenge has already started");
        challengePool.joinChallenge(1);
    }
    
    function testVerifyAndDistributePrizes() public {
        // Create and setup challenge
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        // Users join
        vm.prank(user1);
        challengePool.joinChallenge(1);
        
        vm.prank(user2);
        challengePool.joinChallenge(1);
        
        vm.prank(user3);
        challengePool.joinChallenge(1);
        
        // Fast forward past end time
        vm.warp(endTime + 1);
        
        // Create winners array (user1 and user2 win)
        address[] memory winners = new address[](2);
        winners[0] = user1;
        winners[1] = user2;
        
        // Create signature
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendSignerPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        uint256 user1BalanceBefore = wldToken.balanceOf(user1);
        uint256 user2BalanceBefore = wldToken.balanceOf(user2);
        uint256 user3BalanceBefore = wldToken.balanceOf(user3);
        
        uint256 expectedPrizePerWinner = (ENTRY_FEE * 3) / 2; // Total pool divided by 2 winners
        
        vm.expectEmit(true, true, true, true);
        emit ChallengeCompleted(1, 2, expectedPrizePerWinner);
        
        challengePool.verifyAndDistributePrizes(1, winners, signature);
        
        // Check balances
        assertEq(wldToken.balanceOf(user1), user1BalanceBefore + expectedPrizePerWinner);
        assertEq(wldToken.balanceOf(user2), user2BalanceBefore + expectedPrizePerWinner);
        assertEq(wldToken.balanceOf(user3), user3BalanceBefore); // No change for non-winner
        
        // Check winner status
        assertTrue(challengePool.isWinner(1, user1));
        assertTrue(challengePool.isWinner(1, user2));
        assertFalse(challengePool.isWinner(1, user3));
        
        // Check challenge completion
        (, , , , , , , , , , bool isCompleted, uint256 winnerCount) = challengePool.getChallengeDetails(1);
        assertTrue(isCompleted);
        assertEq(winnerCount, 2);
        
        // Check winner list
        address[] memory winnerList = challengePool.getChallengeWinners(1);
        assertEq(winnerList.length, 2);
        assertEq(winnerList[0], user1);
        assertEq(winnerList[1], user2);
    }
    
    function testVerifyAndDistributePrizesFailsWithInvalidSignature() public {
        // Setup challenge
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        vm.prank(user1);
        challengePool.joinChallenge(1);
        
        vm.warp(endTime + 1);
        
        address[] memory winners = new address[](1);
        winners[0] = user1;
        
        // Create invalid signature (wrong private key)
        uint256 wrongPrivateKey = 0x9999999999999999999999999999999999999999999999999999999999999999;
        bytes32 messageHash = keccak256(abi.encodePacked(uint256(1), winners));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        vm.expectRevert("Invalid signature");
        challengePool.verifyAndDistributePrizes(1, winners, signature);
    }
    
    function testUpdateBackendSigner() public {
        address newSigner = makeAddr("newSigner");
        
        challengePool.updateBackendSigner(newSigner);
        assertEq(challengePool.backendSigner(), newSigner);
    }
    
    function testUpdateBackendSignerFailsForNonOwner() public {
        address newSigner = makeAddr("newSigner");
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        challengePool.updateBackendSigner(newSigner);
    }
    
    function testGetUserChallenges() public {
        // Create two challenges
        uint256 startTime = block.timestamp + START_TIME_OFFSET;
        uint256 endTime = block.timestamp + END_TIME_OFFSET;
        
        challengePool.createChallenge(
            CHALLENGE_NAME,
            CHALLENGE_DESCRIPTION,
            CHALLENGE_TYPE,
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        challengePool.createChallenge(
            "Sleep Challenge",
            "Get 8 hours of sleep daily",
            "sleep",
            ENTRY_FEE,
            startTime,
            endTime
        );
        
        // User1 joins both challenges
        vm.prank(user1);
        challengePool.joinChallenge(1);
        
        vm.prank(user1);
        challengePool.joinChallenge(2);
        
        // Check user's challenge history
        uint256[] memory userChallenges = challengePool.getUserChallenges(user1);
        assertEq(userChallenges.length, 2);
        assertEq(userChallenges[0], 1);
        assertEq(userChallenges[1], 2);
    }
} 