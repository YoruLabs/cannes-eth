#!/usr/bin/env node

require('dotenv').config();

const recordParticipation = async () => {
  const serverUrl = 'https://livus-server.ngrok.app';
  const challengeId = 3;
  const walletAddress = '0x1234567890123456789012345678901234567890'; // Replace with actual wallet address
  const transactionHash =
    '0x0e0b6829d60db7351b9aec80f8ae8f364e98430ccbcd9ef315edb4b3d0917d37'; // The successful transaction

  console.log('📝 Recording successful participation...');
  console.log(`📋 Challenge ID: ${challengeId}`);
  console.log(`👛 Wallet Address: ${walletAddress}`);
  console.log(`📝 Transaction Hash: ${transactionHash}`);

  try {
    const response = await fetch(
      `${serverUrl}/api/challenges/${challengeId}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          transactionHash,
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

// Run the script
recordParticipation();
