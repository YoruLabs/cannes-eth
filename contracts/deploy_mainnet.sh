#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env file"
else
    echo "❌ .env file not found. Please create one with your PRIVATE_KEY"
    exit 1
fi

# World Chain Mainnet Deployment Script
echo "🌍 Deploying HelloWorldChain to World Chain Mainnet..."
echo "Using public endpoint: https://worldchain-mainnet.g.alchemy.com/public"
echo ""
echo "⚠️  WARNING: This will deploy to MAINNET! Make sure you have enough ETH for gas fees."
echo ""

# Confirmation prompt
read -p "Are you sure you want to deploy to mainnet? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Method 1: Using forge create
echo "Method 1: Using forge create"
forge create src/HelloWorldChain.sol:HelloWorldChain \
  --rpc-url worldchain_mainnet \
  --private-key $PRIVATE_KEY

echo ""
echo "Method 2: Using deployment script"
forge script script/DeployWorldChain.s.sol:DeployWorldChainScript \
  --rpc-url worldchain_mainnet \
  --private-key $PRIVATE_KEY \
  --broadcast

echo ""
echo "🎉 Deployment complete!"
echo "Check the World Chain Mainnet explorer: https://worldscan.org" 