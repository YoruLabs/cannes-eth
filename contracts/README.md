# HealthChallengePool Contract Scripts

This directory contains Forge scripts and bash utilities for deploying and managing the HealthChallengePool contract.

## Overview

The HealthChallengePool contract allows users to create health challenges, join them by staking WLD tokens, and complete them with proper backend signature verification.

## Scripts

### 1. Finish Challenge CLI Script

**File:** `finish_challenge.sh`

A command-line tool to complete challenges from the terminal.

#### Usage

```bash
./finish_challenge.sh [network] [challenge_id] [winners_comma_separated]
```

#### Examples

```bash
# Finish challenge #1 on sepolia with one winner
./finish_challenge.sh sepolia 1 "0xeB780C963C700639f16CD09b4CF4F5c6Bc952730"

# Finish challenge #2 on mainnet with multiple winners
./finish_challenge.sh mainnet 2 "0x123...,0x456...,0x789..."
```

#### Prerequisites

1. Create a `.env` file with your private key:

   ```
   PRIVATE_KEY=0xddfc19cf4d3f82685d82fe4f3fd9d7c8998695bfc8bf3dc2550254196aeddddc
   ```

2. Make sure you have forge installed and configured

3. For mainnet: Update the `CHALLENGE_POOL_ADDRESS` in the script with your deployed contract address

### 2. Mainnet Deployment Script

**File:** `deploy_mainnet.sh`

Deploys the HealthChallengePool contract to World Chain mainnet using the real WLD token.

#### Usage

```bash
./deploy_mainnet.sh
```

#### Prerequisites

1. **Update WLD Token Address**: Before deploying, you must update the `WLD_TOKEN_ADDRESS` in `script/DeployHealthChallengeMainnet.s.sol` with the actual WLD token address on World Chain mainnet.

2. **Environment Setup**: Create a `.env` file with your private key:

   ```
   PRIVATE_KEY=your_private_key_here
   ```

3. **Funds**: Ensure you have sufficient ETH on World Chain mainnet for gas fees.

#### Steps

1. Find the official WLD token address on World Chain mainnet
2. Update `WLD_TOKEN_ADDRESS` in `script/DeployHealthChallengeMainnet.s.sol`
3. Run the deployment script
4. Update frontend configuration with the new contract address
5. Update `finish_challenge.sh` with the new contract address

### 3. Forge Scripts

#### FinishChallenge.s.sol

Core forge script that handles challenge completion with proper signature generation.

**Environment Variables:**

- `PRIVATE_KEY`: Backend signer private key
- `CHALLENGE_POOL_ADDRESS`: Address of the deployed contract
- `CHALLENGE_ID`: ID of the challenge to complete
- `WINNERS`: Comma-separated list of winner addresses

#### DeployHealthChallengeMainnet.s.sol

Deployment script for World Chain mainnet using real WLD tokens.

**Features:**

- Uses real WLD token instead of MockWLD
- Provides deployment summary and next steps
- Includes network detection and explorer links

## Network Configuration

### Sepolia Testnet

- **RPC URL**: `https://worldchain-sepolia.g.alchemy.com/public`
- **Chain ID**: 4801
- **Explorer**: https://worldchain-sepolia.explorer.alchemy.com
- **Contract Address**: `0x79399A62F79484171c9a324833F01Bf62a4E1f98`

### Mainnet

- **RPC URL**: `https://worldchain-mainnet.g.alchemy.com/public`
- **Chain ID**: 480
- **Explorer**: https://worldscan.org
- **Contract Address**: To be deployed

## Finding the WLD Token Address

To find the official WLD token address on World Chain mainnet:

1. Check the official World documentation: https://docs.world.org
2. Look for "Useful Contract Deployments" section
3. Check World Chain explorer: https://worldscan.org
4. Verify with the World team or community

**Important**: Make sure you're using the official WLD token address and not a fake or wrapped version.

## Security Considerations

1. **Private Keys**: Never commit private keys to git. Use `.env` files and add them to `.gitignore`.

2. **Backend Signer**: For production, use a separate backend signer key instead of the deployer key.

3. **Signature Verification**: The contract verifies signatures to ensure only authorized completions.

4. **Testing**: Always test on testnet before mainnet deployment.

## Troubleshooting

### Common Issues

1. **"execution reverted"**: Usually means invalid signature or challenge state
2. **"PRIVATE_KEY not found"**: Check your `.env` file exists and has the right format
3. **"Insufficient funds"**: Make sure you have enough ETH for gas fees
4. **"Contract not found"**: Verify the contract address is correct for your network

### Debugging

Use cast to inspect contract state:

```bash
# Check challenge details
cast call $CONTRACT_ADDRESS "getChallengeDetails(uint256)" $CHALLENGE_ID --rpc-url $RPC_URL

# Check if address is backend signer
cast call $CONTRACT_ADDRESS "backendSigner()" --rpc-url $RPC_URL
```

## Example Workflow

1. **Deploy to Mainnet**:

   ```bash
   # Update WLD token address first
   ./deploy_mainnet.sh
   ```

2. **Create a Challenge** (via frontend or direct contract call)

3. **Users Join Challenge** (via frontend)

4. **Complete Challenge**:

   ```bash
   ./finish_challenge.sh mainnet 1 "0xwinner1,0xwinner2"
   ```

5. **Verify Completion**:
   ```bash
   cast call $CONTRACT_ADDRESS "getChallengeDetails(uint256)" 1 --rpc-url $RPC_URL
   ```

## Support

For issues or questions:

- Check the contract tests in `test/`
- Review the contract source in `src/`
- Consult World Chain documentation
- Ask in the project Discord/Telegram
