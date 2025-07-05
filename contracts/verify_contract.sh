#!/bin/bash

# Verify Contract on World Chain
# Usage: ./verify_contract.sh [network] [contract_address]

# Check if all parameters are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 [network] [contract_address]"
    echo "Example: $0 mainnet 0x121AD2575b7ecbAb1efC9ca3fED56D46747a720A"
    echo "Example: $0 sepolia 0x79399A62F79484171c9a324833F01Bf62a4E1f98"
    exit 1
fi

NETWORK=$1
CONTRACT_ADDRESS=$2

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env file"
else
    echo "❌ .env file not found. Please create one with your ETHERSCAN_API_KEY"
    exit 1
fi

# Set network-specific variables
if [ "$NETWORK" = "sepolia" ]; then
    RPC_URL="https://worldchain-sepolia.g.alchemy.com/public"
    CHAIN_ID=11155111
    VERIFIER_URL="https://worldchain-sepolia.explorer.alchemy.com/api"
elif [ "$NETWORK" = "mainnet" ]; then
    RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"
    CHAIN_ID=480
    VERIFIER_URL="https://worldscan.org/api"
else
    echo "❌ Unsupported network: $NETWORK"
    echo "Supported networks: sepolia, mainnet"
    exit 1
fi

echo "🔍 Verifying contract on World Chain $NETWORK"
echo "Contract: $CONTRACT_ADDRESS"
echo "Network: $NETWORK"
echo "Chain ID: $CHAIN_ID"
echo "RPC URL: $RPC_URL"
echo ""

# Try different verification approaches
echo "📋 Attempting verification with different methods..."
echo ""

echo "Method 1: Standard Etherscan verification"
forge verify-contract \
    --chain-id $CHAIN_ID \
    --rpc-url $RPC_URL \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --compiler-version 0.8.20 \
    --num-of-optimizations 200 \
    $CONTRACT_ADDRESS \
    src/HealthChallengePool.sol:HealthChallengePool

if [ $? -eq 0 ]; then
    echo "✅ Verification successful with Method 1!"
    exit 0
fi

echo ""
echo "Method 1 failed. Trying Method 2: Custom verifier URL"
forge verify-contract \
    --chain-id $CHAIN_ID \
    --rpc-url $RPC_URL \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --verifier-url $VERIFIER_URL \
    --compiler-version 0.8.20 \
    --num-of-optimizations 200 \
    $CONTRACT_ADDRESS \
    src/HealthChallengePool.sol:HealthChallengePool

if [ $? -eq 0 ]; then
    echo "✅ Verification successful with Method 2!"
    exit 0
fi

echo ""
echo "❌ Automatic verification failed. Manual verification required."
echo ""
echo "📋 Manual Verification Instructions:"
echo "1. Go to: https://worldscan.org/address/$CONTRACT_ADDRESS"
echo "2. Look for 'Verify Contract' or 'Contract' tab"
echo "3. Upload the following files:"
echo "   - src/HealthChallengePool.sol"
echo "   - All imported files from src/ and lib/"
echo "4. Use these compilation settings:"
echo "   - Compiler: 0.8.20"
echo "   - Optimization: Enabled (200 runs)"
echo "   - EVM Version: paris"
echo ""
echo "🔧 Alternative: Use Sourcify or other verification services"
echo "   - https://sourcify.dev/"
echo "   - Upload your source files there"
echo "" 