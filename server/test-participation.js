#!/usr/bin/env node

require('dotenv').config();

const testParticipation = async () => {
  const serverUrl = 'http://localhost:3001';
  const challengeId = 3;
  const testWalletAddress = '0x1234567890123456789012345678901234567890';
  const testTransactionHash =
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

  console.log('🧪 Testing challenge participation endpoint...');
  console.log(`📋 Challenge ID: ${challengeId}`);
  console.log(`👛 Wallet Address: ${testWalletAddress}`);
  console.log(`📝 Transaction Hash: ${testTransactionHash}`);

  try {
    const response = await fetch(
      `${serverUrl}/api/challenges/${challengeId}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: testWalletAddress,
          transactionHash: testTransactionHash,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Participation recorded successfully!');
      console.log('📊 Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Failed to record participation');
      console.log('📊 Error response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Run the test
testParticipation();
