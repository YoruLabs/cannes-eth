#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const challengeService = require('../src/services/challengeService');

async function createChallenge() {
  try {
    console.log('🏃‍♂️ Creating Sleep Challenge...\n');

    // Get predefined sleep challenges
    const predefinedChallenges =
      challengeService.getPredefinedSleepChallenges();

    // Show options
    console.log('Available predefined challenges:');
    predefinedChallenges.forEach((challenge, index) => {
      console.log(`${index + 1}. ${challenge.title}`);
      console.log(`   ${challenge.description}`);
      console.log(`   Entry Fee: ${challenge.entryFee} WLD`);
      console.log(
        `   Target: ${challenge.targetValue} ${challenge.targetUnit}`
      );
      console.log('');
    });

    // For now, create the first one (Sleep Efficiency Master)
    const challengeData = predefinedChallenges[0];

    console.log(`Creating: ${challengeData.title}`);
    console.log('⏳ Sending transaction...');

    const result = await challengeService.createChallenge(challengeData);

    console.log('✅ Challenge created successfully!');
    console.log(`Challenge ID: ${result.challengeId}`);
    console.log(`Transaction Hash: ${result.transactionHash}`);
    console.log(
      `Entry Period: ${challengeData.entryStartTime} to ${challengeData.entryEndTime}`
    );
    console.log(
      `Challenge Period: ${challengeData.challengeStartTime} to ${challengeData.challengeEndTime}`
    );
  } catch (error) {
    console.error('❌ Failed to create challenge:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createChallenge();
}

module.exports = { createChallenge };
