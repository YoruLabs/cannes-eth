#!/bin/bash

# Create Test Challenge Script
# Usage: ./create_challenge.sh [entry_fee_in_wld]
# Example: ./create_challenge.sh 10

# Check if entry fee parameter is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 [entry_fee_in_wld]"
    echo "Example: $0 10  # Creates challenge with 10 WLD entry fee"
    exit 1
fi

ENTRY_FEE=$1

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

# Set contract address for mainnet
CHALLENGE_POOL_ADDRESS="0x121AD2575b7ecbAb1efC9ca3fED56D46747a720A"
RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"

echo "🏆 Creating Challenge on World Chain Mainnet"
echo "Entry Fee: $ENTRY_FEE WLD"
echo "Challenge Pool: $CHALLENGE_POOL_ADDRESS"
echo ""

# Confirmation prompt
read -p "Are you sure you want to create this challenge? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

# Run the forge script with environment variables
echo "🚀 Creating challenge..."

# Convert entry fee to wei using cast (handles decimals properly)
ENTRY_FEE_WEI=$(cast to-wei $ENTRY_FEE ether)
echo "Entry Fee in Wei: $ENTRY_FEE_WEI"

CHALLENGE_POOL_ADDRESS=$CHALLENGE_POOL_ADDRESS \
ENTRY_FEE_WEI=$ENTRY_FEE_WEI \
forge script script/CreateTestChallenge.s.sol:CreateTestChallengeScript \
    --rpc-url $RPC_URL \
    --broadcast

echo ""
echo "🎉 Challenge creation script executed!"
echo "Check the transaction on WorldScan: https://worldscan.org/address/$CHALLENGE_POOL_ADDRESS"
echo ""
echo "💡 To check the challenge details, you can use:"
echo "cast call $CHALLENGE_POOL_ADDRESS \"getChallengeDetails(uint256)\" [CHALLENGE_ID] --rpc-url $RPC_URL" 