# Deployment Log

This file tracks all contract deployments across different networks.

## World Chain Sepolia Testnet (Chain ID: 4801)

### MockWLDToken

- **Contract Address**: `0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4`
- **Transaction Hash**: `0xdd31bf36b72899362452182c8030972ce06ccc6ccf5bda050f213895a5ab82d0`
- **Block Number**: 15585124
- **Deployed**: 2025-01-05
- **Gas Used**: 712,132 gas
- **Gas Cost**: 0.000000000178745132 ETH
- **Deployer**: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`
- **Block Explorer**: [View on World Chain Sepolia Explorer](https://worldchain-sepolia.explorer.alchemy.com/address/0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4)

**Token Details:**

- Name: Worldcoin
- Symbol: WLD
- Total Supply: 1,000,000 WLD tokens
- Decimals: 18
- Owner: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`

### HealthChallengePool

- **Contract Address**: `0x73c455192547Feb273C000d8B9ee475bA7EabE49`
- **Transaction Hash**: `0xb7f3e386d928c6143e598e8e2cd9b6187a66751e13eb65a6be900754a9953cee`
- **Block Number**: 15585284
- **Deployed**: 2025-01-05
- **Gas Used**: 1,615,021 gas
- **Gas Cost**: 0.000000000405370271 ETH
- **Deployer**: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`
- **Block Explorer**: [View on World Chain Sepolia Explorer](https://worldchain-sepolia.explorer.alchemy.com/address/0x73c455192547Feb273C000d8B9ee475bA7EabE49)

**Contract Details:**

- WLD Token Address: `0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4`
- Backend Signer: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`
- Owner: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`
- Challenge Counter: 0 (ready for challenges)

---

## World Chain Mainnet (Chain ID: 480)

### Contracts

- **Status**: No deployments yet

---

## Deployment Commands

### Deploy MockWLDToken ✅ COMPLETED

```bash
source .env && forge script script/DeployMockWLD.s.sol:DeployMockWLDScript \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Deploy HealthChallengePool ✅ COMPLETED

```bash
source .env && forge script script/DeployHealthChallengeWithToken.s.sol:DeployHealthChallengeWithTokenScript \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Deploy Full System (Alternative)

```bash
# Deploy both contracts in one go
source .env && forge script script/DeployFullSystem.s.sol:DeployFullSystemScript \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

## Environment Variables

Make sure your `.env` file contains:

```bash
PRIVATE_KEY=0xddfc19cf4d3f82685d82fe4f3fd9d7c8998695bfc8bf3dc2550254196aeddddc
ALCHEMY_API_KEY=M0SacIbUSEoO0Ob2Be84mQfLJO3Y3eaM
```

---

## Network Information

### World Chain Sepolia Testnet

- **Chain ID**: 4801 (0x12C1)
- **RPC URL**: https://worldchain-sepolia.g.alchemy.com/public
- **Block Explorer**: https://worldchain-sepolia.explorer.alchemy.com
- **Faucet**: Get testnet ETH from World Chain Sepolia faucet

### World Chain Mainnet

- **Chain ID**: 480 (0x1e0)
- **RPC URL**: https://worldchain-mainnet.g.alchemy.com/public
- **Block Explorer**: https://worldscan.org

---

## Quick Contract Interaction

### MockWLDToken Functions

```bash
# Check balance
cast call 0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4 "balanceOf(address)" YOUR_ADDRESS \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Check total supply
cast call 0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4 "totalSupply()" \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Mint tokens (only owner)
cast send 0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4 "mint(address,uint256)" RECIPIENT_ADDRESS AMOUNT \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY
```

### HealthChallengePool Functions

```bash
# Check challenge counter
cast call 0x73c455192547Feb273C000d8B9ee475bA7EabE49 "challengeCounter()" \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Check backend signer
cast call 0x73c455192547Feb273C000d8B9ee475bA7EabE49 "backendSigner()" \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Check WLD token address
cast call 0x73c455192547Feb273C000d8B9ee475bA7EabE49 "wldToken()" \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Create a challenge (only owner)
cast send 0x73c455192547Feb273C000d8B9ee475bA7EabE49 \
  "createChallenge(string,string,uint256,uint256,uint256)" \
  "10K Steps Daily" \
  "Walk 10,000 steps every day for 7 days" \
  1000000000000000000 \
  1736208000 \
  1736812800 \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY

# Get challenge details
cast call 0x73c455192547Feb273C000d8B9ee475bA7EabE49 "challenges(uint256)" 1 \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Join a challenge (first approve WLD tokens)
cast send 0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4 \
  "approve(address,uint256)" \
  0x73c455192547Feb273C000d8B9ee475bA7EabE49 \
  1000000000000000000 \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY

# Then join the challenge
cast send 0x73c455192547Feb273C000d8B9ee475bA7EabE49 "joinChallenge(uint256)" 1 \
  --rpc-url https://worldchain-sepolia.g.alchemy.com/public \
  --private-key $PRIVATE_KEY
```

---

**Last Updated**: 2025-01-05
