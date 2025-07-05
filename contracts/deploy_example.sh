#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env file"
else
    echo "❌ .env file not found. Please create one with your PRIVATE_KEY"
    exit 1
fi

# World Chain Sepolia Deployment Script
echo "🌍 Deploying HelloWorldChain to World Chain Sepolia..."
echo "Using Alchemy endpoint: https://worldchain-sepolia.g.alchemy.com/v2/M0SacIbUSEoO0Ob2Be84mQfLJO3Y3eaM"
echo ""

# Method 1: Using forge create (like your original example)
echo "Method 1: Using forge create"
forge create src/HelloWorldChain.sol:HelloWorldChain \
  --rpc-url worldchain_sepolia \
  --private-key $PRIVATE_KEY

echo ""
echo "Method 2: Using deployment script"
forge script script/DeployWorldChain.s.sol:DeployWorldChainScript \
  --rpc-url worldchain_sepolia \
  --private-key $PRIVATE_KEY \
  --broadcast

echo ""
echo "🎉 Deployment complete!"
echo "Check the World Chain Sepolia explorer: https://worldchain-sepolia.explorer.alchemy.com" 