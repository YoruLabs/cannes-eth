# Smart Contract Deployment

## World Chain Sepolia (Testnet)

### Latest Deployment - January 2025

**HealthChallengePool (Simplified)**

- Address: `0x79399A62F79484171c9a324833F01Bf62a4E1f98`
- [View on Explorer](https://worldchain-sepolia.explorer.alchemy.com/address/0x79399A62F79484171c9a324833F01Bf62a4E1f98)

**MockWLDToken**

- Address: `0xAb9f2cdB64F838557050c397f5fBE42A145C6C61`
- [View on Explorer](https://worldchain-sepolia.explorer.alchemy.com/address/0xAb9f2cdB64F838557050c397f5fBE42A145C6C61)

**Network Info:**

- Chain ID: 4801
- RPC: `https://worldchain-sepolia.g.alchemy.com/public`
- Owner/Deployer: `0xeB780C963C700639f16CD09b4CF4F5c6Bc952730`

## Quick Commands

### Deploy New Contracts

```bash
forge script script/DeployHealthChallenge.s.sol --rpc-url https://worldchain-sepolia.g.alchemy.com/public --broadcast
```

### Test Contract

```bash
# Check challenge counter
cast call 0x79399A62F79484171c9a324833F01Bf62a4E1f98 "challengeCounter()" --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Create challenge (1 WLD entry fee)
cast send 0x79399A62F79484171c9a324833F01Bf62a4E1f98 "createChallenge(uint256)" 1000000000000000000 --private-key $PRIVATE_KEY --rpc-url https://worldchain-sepolia.g.alchemy.com/public

# Check challenge details
cast call 0x79399A62F79484171c9a324833F01Bf62a4E1f98 "getChallengeDetails(uint256)" 1 --rpc-url https://worldchain-sepolia.g.alchemy.com/public
```

### Environment Setup

```bash
# .env file
PRIVATE_KEY=ddfc19cf4d3f82685d82fe4f3fd9d7c8998695bfc8bf3dc2550254196aeddddc
ALCHEMY_API_KEY=M0SacIbUSEoO0Ob2Be84mQfLJO3Y3eaM
```

## Contract Features

- ✅ Simplified structure (no start/end times)
- ✅ WLD token staking system
- ✅ Challenge creation, joining, completion
- ✅ Prize distribution to winners
- ✅ Backend signature verification
- ✅ 22/22 tests passing

## Ready for Production

- Challenge #1 created with 1 WLD entry fee
- 1,000,000 WLD tokens available for testing
- Frontend integrated with new contracts
