#!/bin/bash

# Deploy HealthChallengePool to World Chain Mainnet
# This script deploys the contract using the real WLD token

echo "🚀 Deploying HealthChallengePool to World Chain Mainnet"
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env file"
else
    echo "❌ .env file not found. Please create one with your PRIVATE_KEY"
    exit 1
fi

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not found in environment variables"
    echo "Please add PRIVATE_KEY=your_private_key_here to your .env file"
    exit 1
fi

# Network configuration
RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"
CHAIN_ID=480

echo "Network: World Chain Mainnet"
echo "RPC URL: $RPC_URL"
echo "Chain ID: $CHAIN_ID"
echo ""

# Warning about mainnet deployment
echo "⚠️  WARNING: You are about to deploy to MAINNET!"
echo "This will use real funds and deploy a live contract."
echo ""

# Check WLD token address
echo "📋 Pre-deployment checklist:"
echo "1. ✅ Make sure you have updated the WLD_TOKEN_ADDRESS in DeployHealthChallengeMainnet.s.sol"
echo "2. ✅ Make sure you have sufficient ETH for gas fees"
echo "3. ✅ Make sure your private key is correct"
echo "4. ✅ Make sure you want to use the deployer as the backend signer"
echo ""

# Confirmation prompt
read -p "Have you completed the checklist above? Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo "🚀 Starting deployment..."
echo ""

# Run the deployment script
forge script script/DeployHealthChallengeMainnet.s.sol:DeployHealthChallengeMainnetScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --chain-id $CHAIN_ID

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the deployed contract address from the output above"
    echo "2. Update the frontend configuration (client/lib/web3.ts) with the new contract address"
    echo "3. Update finish_challenge.sh with the new contract address"
    echo "4. Test the contract on World Chain mainnet"
    echo "5. Consider setting up a separate backend signer for production"
    echo ""
    echo "🔍 You can view your contract on the explorer:"
    echo "https://worldscan.org/address/[YOUR_CONTRACT_ADDRESS]"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi 