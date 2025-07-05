# Health Challenge Pool - WLD Token Staking System

A decentralized health challenge platform where users stake WLD tokens and compete in health-related challenges. Winners share the prize pool based on verified completion data from wearable devices like Oura rings.

## 🏆 System Overview

The Health Challenge Pool allows:

- **Challenge Creation**: Admins create health challenges (steps, sleep, heart rate, etc.)
- **Staking**: Users stake WLD tokens to enter challenges
- **Verification**: Backend verifies completion using signed data from wearables
- **Prize Distribution**: Winners automatically share the total prize pool

## 📋 Smart Contracts

### HealthChallengePool.sol

Main contract handling:

- Challenge lifecycle management
- WLD token staking and prize distribution
- Cryptographic verification of challenge completion
- User participation tracking

### MockWLDToken.sol

Mock WLD token for testing (replace with real WLD token address in production)

## 🔧 Key Features

### Challenge Types Supported

- **Steps**: Daily step count goals (e.g., 10,000 steps/day)
- **Sleep**: Sleep quality/duration targets
- **Heart Rate**: Heart rate zone training
- **Custom**: Any health metric your backend can verify

### Security Features

- **Signature Verification**: Backend signs winner data with private key
- **Reentrancy Protection**: Safe from reentrancy attacks
- **Access Control**: Only admins can create/cancel challenges
- **Participant Validation**: Only participants can win prizes

### Gas Optimization Notes

⚠️ **For Loop Consideration**: The contract contains for loops in prize distribution and cancellation functions. For production with many participants, consider:

- Batch processing for large winner lists
- Pagination for refunds
- Gas limit considerations for challenge sizes

## 🚀 Deployment

### Deploy to World Chain Sepolia

```bash
# Load environment variables
source .env

# Deploy contracts
forge script script/DeployHealthChallenge.s.sol:DeployHealthChallengeScript \
  --rpc-url worldchain_sepolia \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Deploy to World Chain Mainnet

```bash
forge script script/DeployHealthChallenge.s.sol:DeployHealthChallengeScript \
  --rpc-url worldchain_mainnet \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## 📖 Usage Examples

### 1. Create a Challenge

```solidity
// Admin creates a 7-day step challenge
challengePool.createChallenge(
    "10K Steps Challenge",
    "Walk 10,000 steps daily for 7 days",
    "steps",
    10 * 10**18, // 10 WLD entry fee
    block.timestamp + 1 hours, // Start in 1 hour
    block.timestamp + 8 days   // End in 8 days
);
```

### 2. Join a Challenge

```solidity
// User approves WLD spending
wldToken.approve(address(challengePool), entryFee);

// User joins challenge
challengePool.joinChallenge(1); // Challenge ID 1
```

### 3. Verify Winners (Backend)

```javascript
// Backend verifies challenge completion and creates signature
const winners = ["0x123...", "0x456..."]; // Addresses of users who completed challenge
const challengeId = 1;

// Create message hash
const messageHash = ethers.utils.solidityKeccak256(
  ["uint256", "address[]"],
  [challengeId, winners]
);

// Sign with backend private key
const signature = await backendWallet.signMessage(
  ethers.utils.arrayify(messageHash)
);

// Call contract to distribute prizes
await challengePool.verifyAndDistributePrizes(challengeId, winners, signature);
```

## 🧪 Testing

Run comprehensive tests:

```bash
# Run all tests
forge test -vv

# Run specific test
forge test --match-test testVerifyAndDistributePrizes -vvv

# Generate gas report
forge test --gas-report
```

### Test Coverage

- ✅ Challenge creation and management
- ✅ User participation and staking
- ✅ Signature verification
- ✅ Prize distribution
- ✅ Access control
- ✅ Edge cases and error conditions

## 🔐 Backend Integration

### Signature Generation (Node.js Example)

```javascript
const ethers = require("ethers");

class HealthChallengeBackend {
  constructor(privateKey) {
    this.wallet = new ethers.Wallet(privateKey);
  }

  async verifyChallenge(challengeId, participants, healthData) {
    // Your health data verification logic here
    // Check Oura API, validate step counts, sleep data, etc.

    const winners = participants.filter((participant) =>
      this.meetsChallengeCriteria(participant, healthData)
    );

    return this.signWinners(challengeId, winners);
  }

  async signWinners(challengeId, winners) {
    const messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "address[]"],
      [challengeId, winners]
    );

    const signature = await this.wallet.signMessage(
      ethers.utils.arrayify(messageHash)
    );

    return { winners, signature };
  }

  meetsChallengeCriteria(participant, healthData) {
    // Implement your challenge criteria logic
    // Example: Check if user achieved 10k steps for 7 days
    return healthData[participant].completedChallenge;
  }
}
```

### Oura Integration Example

```javascript
// Example integration with Oura API
async function getOuraStepData(userId, startDate, endDate) {
  const response = await fetch(
    `https://api.ouraring.com/v2/usercollection/daily_activity`,
    {
      headers: {
        Authorization: `Bearer ${ouraToken}`,
      },
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }
  );

  const data = await response.json();
  return data.data.map((day) => day.steps);
}

async function verifyStepChallenge(userId, requiredSteps, challengeDays) {
  const stepData = await getOuraStepData(userId, startDate, endDate);
  const completedDays = stepData.filter(
    (steps) => steps >= requiredSteps
  ).length;

  return completedDays >= challengeDays;
}
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │  Smart Contract │
│   (User App)    │    │  (Verification)  │    │ (Prize Pool)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Join Challenge     │                       │
         ├──────────────────────────────────────────────→│
         │                       │                       │
         │ 2. Submit Health Data │                       │
         ├──────────────────────→│                       │
         │                       │                       │
         │                       │ 3. Verify & Sign     │
         │                       ├──────────────────────→│
         │                       │                       │
         │ 4. Receive Prize      │                       │
         │←──────────────────────────────────────────────┤
```

## 🔒 Security Considerations

1. **Private Key Management**: Keep backend signing key secure
2. **Signature Validation**: Always verify signatures on-chain
3. **Access Control**: Only authorized addresses can create challenges
4. **Reentrancy Protection**: Built-in protection against reentrancy attacks
5. **Input Validation**: All inputs are validated before processing

## 📊 Gas Costs (Approximate)

| Function                   | Gas Cost               |
| -------------------------- | ---------------------- |
| Create Challenge           | ~290k                  |
| Join Challenge             | ~490k                  |
| Verify Winners (2 winners) | ~850k                  |
| Cancel Challenge           | Varies by participants |

## 🌐 Network Information

### World Chain Sepolia Testnet

- **Chain ID**: 4801
- **RPC**: Your Alchemy endpoint
- **Explorer**: https://worldchain-sepolia.explorer.alchemy.com

### World Chain Mainnet

- **Chain ID**: 480
- **RPC**: Your Alchemy endpoint
- **Explorer**: https://worldscan.org

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add comprehensive tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Telegram**: @worldcoindevelopers
- **Documentation**: Check official World Chain docs
- **Issues**: Create GitHub issues for bugs/features

---

**⚠️ Important**: This is a demo implementation. For production use:

- Replace MockWLDToken with real WLD token address
- Implement proper backend authentication
- Add additional security measures
- Consider gas optimization for large participant lists
- Implement proper error handling and monitoring
