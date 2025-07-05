// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title HealthChallengePool
 * @dev Simplified contract for health challenges - metadata handled by backend
 */
contract HealthChallengePool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // WLD Token contract
    IERC20 public immutable wldToken;
    
    // Backend signer address for verification
    address public backendSigner;
    
    // Challenge counter
    uint256 public challengeCounter;
    
    // Challenge struct - simplified
    struct Challenge {
        uint256 id;
        uint256 entryFee;
        uint256 totalPool;
        uint256 participantCount;
        uint256 winnerCount;
        bool isActive;
        bool isCompleted;
        mapping(address => bool) participants;
        mapping(address => bool) winners;
        address[] participantList;
        address[] winnerList;
    }
    
    // Mapping from challenge ID to challenge
    mapping(uint256 => Challenge) public challenges;
    
    // User participation tracking
    mapping(address => uint256[]) public userChallenges;
    
    // Events
    event ChallengeCreated(uint256 indexed challengeId, uint256 entryFee);
    
    event UserJoinedChallenge(uint256 indexed challengeId, address indexed user, uint256 amount);
    
    event ChallengeCompleted(uint256 indexed challengeId, uint256 winnerCount, uint256 prizePerWinner);
    
    event WinnerVerified(uint256 indexed challengeId, address indexed winner, uint256 prize);
    
    event BackendSignerUpdated(address indexed oldSigner, address indexed newSigner);
    
    constructor(address _wldToken, address _backendSigner) Ownable(msg.sender) {
        require(_wldToken != address(0), "Invalid WLD token address");
        require(_backendSigner != address(0), "Invalid backend signer address");
        
        wldToken = IERC20(_wldToken);
        backendSigner = _backendSigner;
    }
    
    /**
     * @dev Create a new challenge
     */
    function createChallenge(uint256 _entryFee) external onlyOwner {
        require(_entryFee > 0, "Entry fee must be greater than 0");
        
        challengeCounter++;
        
        Challenge storage newChallenge = challenges[challengeCounter];
        newChallenge.id = challengeCounter;
        newChallenge.entryFee = _entryFee;
        newChallenge.isActive = true;
        newChallenge.isCompleted = false;
        
        emit ChallengeCreated(challengeCounter, _entryFee);
    }
    
    /**
     * @dev Join a challenge by staking WLD tokens
     */
    function joinChallenge(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.isActive, "Challenge is not active");
        require(!challenge.isCompleted, "Challenge is already completed");
        require(!challenge.participants[msg.sender], "Already joined this challenge");
        
        // Transfer WLD tokens from user to contract
        wldToken.safeTransferFrom(msg.sender, address(this), challenge.entryFee);
        
        // Add user to challenge
        challenge.participants[msg.sender] = true;
        challenge.participantList.push(msg.sender);
        challenge.participantCount++;
        challenge.totalPool += challenge.entryFee;
        
        // Track user's challenges
        userChallenges[msg.sender].push(_challengeId);
        
        emit UserJoinedChallenge(_challengeId, msg.sender, challenge.entryFee);
    }
    
    /**
     * @dev Complete challenge and distribute prizes
     * @param _challengeId The challenge ID
     * @param _winners Array of winner addresses
     * @param _signature Backend signature verifying the winners
     */
    function completeChallenge(
        uint256 _challengeId,
        address[] calldata _winners,
        bytes calldata _signature
    ) external nonReentrant {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.isActive, "Challenge is not active");
        require(!challenge.isCompleted, "Challenge already completed");
        require(_winners.length > 0, "No winners provided");
        require(_winners.length <= challenge.participantCount, "Too many winners");
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(_challengeId, _winners));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ECDSA.recover(ethSignedMessageHash, _signature);
        
        require(recoveredSigner == backendSigner, "Invalid signature");
        
        // Verify all winners are participants
        for (uint256 i = 0; i < _winners.length; i++) {
            require(challenge.participants[_winners[i]], "Winner not a participant");
            require(!challenge.winners[_winners[i]], "Winner already processed");
        }
        
        // Calculate prize per winner
        uint256 prizePerWinner = challenge.totalPool / _winners.length;
        
        // Mark challenge as completed
        challenge.isCompleted = true;
        challenge.winnerCount = _winners.length;
        
        // Distribute prizes
        for (uint256 i = 0; i < _winners.length; i++) {
            address winner = _winners[i];
            challenge.winners[winner] = true;
            challenge.winnerList.push(winner);
            
            // Transfer prize to winner
            wldToken.safeTransfer(winner, prizePerWinner);
            
            emit WinnerVerified(_challengeId, winner, prizePerWinner);
        }
        
        emit ChallengeCompleted(_challengeId, _winners.length, prizePerWinner);
    }
    
    /**
     * @dev Cancel a challenge and refund participants
     */
    function cancelChallenge(uint256 _challengeId) external onlyOwner {
        Challenge storage challenge = challenges[_challengeId];
        
        require(challenge.isActive, "Challenge is not active");
        require(!challenge.isCompleted, "Challenge already completed");
        
        challenge.isActive = false;
        
        // Refund all participants
        for (uint256 i = 0; i < challenge.participantList.length; i++) {
            address participant = challenge.participantList[i];
            wldToken.safeTransfer(participant, challenge.entryFee);
        }
    }
    
    /**
     * @dev Update backend signer address
     */
    function updateBackendSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        
        address oldSigner = backendSigner;
        backendSigner = _newSigner;
        
        emit BackendSignerUpdated(oldSigner, _newSigner);
    }
    
    /**
     * @dev Get challenge details
     */
    function getChallengeDetails(uint256 _challengeId) external view returns (
        uint256 id,
        uint256 entryFee,
        uint256 totalPool,
        uint256 participantCount,
        uint256 winnerCount,
        bool isActive,
        bool isCompleted
    ) {
        Challenge storage challenge = challenges[_challengeId];
        
        return (
            challenge.id,
            challenge.entryFee,
            challenge.totalPool,
            challenge.participantCount,
            challenge.winnerCount,
            challenge.isActive,
            challenge.isCompleted
        );
    }
    
    /**
     * @dev Get challenge participants
     */
    function getChallengeParticipants(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].participantList;
    }
    
    /**
     * @dev Get challenge winners
     */
    function getChallengeWinners(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].winnerList;
    }
    
    /**
     * @dev Check if user is participant in challenge
     */
    function isParticipant(uint256 _challengeId, address _user) external view returns (bool) {
        return challenges[_challengeId].participants[_user];
    }
    
    /**
     * @dev Check if user is winner in challenge
     */
    function isWinner(uint256 _challengeId, address _user) external view returns (bool) {
        return challenges[_challengeId].winners[_user];
    }
    
    /**
     * @dev Get user's challenge history
     */
    function getUserChallenges(address _user) external view returns (uint256[] memory) {
        return userChallenges[_user];
    }
} 