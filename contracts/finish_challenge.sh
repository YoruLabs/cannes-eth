#!/bin/bash

# Finish Challenge Script
# Usage: ./finish_challenge.sh [network] [challenge_id] [winners_comma_separated]
# Example: ./finish_challenge.sh sepolia 1 "0x123...,0x456..."

# Check if all parameters are provided
if [ $# -ne 3 ]; then
    echo "Usage: $0 [network] [challenge_id] [winners_comma_separated]"
    echo "Example: $0 sepolia 1 \"0xeB780C963C700639f16CD09b4CF4F5c6Bc952730\""
    echo "Example: $0 mainnet 2 \"0x123...,0x456...,0x789...\""
    exit 1
fi

NETWORK=$1
CHALLENGE_ID=$2
WINNERS=$3

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env file"
else
    echo "❌ .env file not found. Please create one with your PRIVATE_KEY"
    exit 1
fi

# Set contract address based on network
if [ "$NETWORK" = "sepolia" ]; then
    export CHALLENGE_POOL_ADDRESS="0x79399A62F79484171c9a324833F01Bf62a4E1f98"
    RPC_URL="https://worldchain-sepolia.g.alchemy.com/public"
    EXPLORER_URL="https://worldchain-sepolia.explorer.alchemy.com"
elif [ "$NETWORK" = "mainnet" ]; then
    export CHALLENGE_POOL_ADDRESS="0x121AD2575b7ecbAb1efC9ca3fED56D46747a720A"
    RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"
    EXPLORER_URL="https://worldscan.org"
else
    echo "❌ Unsupported network: $NETWORK"
    echo "Supported networks: sepolia, mainnet"
    exit 1
fi

echo "🏆 Finishing Challenge on $NETWORK"
echo "Challenge ID: $CHALLENGE_ID"
echo "Winners: $WINNERS"
echo "Challenge Pool: $CHALLENGE_POOL_ADDRESS"
echo ""

# Confirmation prompt
read -p "Are you sure you want to finish this challenge? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

# Run the forge script with environment variables
echo "🚀 Executing challenge completion..."
CHALLENGE_POOL_ADDRESS=$CHALLENGE_POOL_ADDRESS \
CHALLENGE_ID=$CHALLENGE_ID \
WINNERS="$WINNERS" \
forge script script/FinishChallenge.s.sol:FinishChallengeScript \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify

echo ""
echo "🎉 Challenge completion script executed!"
echo "Check the transaction on the explorer: $EXPLORER_URL"
echo ""
echo "💡 To verify the challenge was completed, you can check:"
echo "cast call $CHALLENGE_POOL_ADDRESS \"getChallengeDetails(uint256)\" $CHALLENGE_ID --rpc-url $RPC_URL" 