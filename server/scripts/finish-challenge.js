#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const challengeService = require('../src/services/challengeService');

async function finishChallenge(challengeId) {
  try {
    if (!challengeId) {
      console.error('❌ Please provide a challenge ID');
      console.log('Usage: node scripts/finish-challenge.js <challengeId>');
      process.exit(1);
    }

    console.log(`🏁 Finishing challenge ${challengeId}...\n`);

    // Get challenge details first
    const challenge = await challengeService.getChallengeDetails(challengeId);

    if (!challenge) {
      console.error(`❌ Challenge ${challengeId} not found`);
      process.exit(1);
    }

    console.log(`Challenge: ${challenge.title}`);
    console.log(`Current Status: ${challenge.status}`);
    console.log(`Type: ${challenge.challengeType}`);
    console.log(`Participants: ${challenge.participantCount}`);
    console.log('');

    // Check if it's a sleep challenge
    if (challenge.metricType) {
      console.log(`📊 Sleep Challenge Detected`);
      console.log(`Metric: ${challenge.metricType}`);
      console.log(`Target: ${challenge.targetValue} ${challenge.targetUnit}`);
      console.log(`Calculation: ${challenge.metricCalculation}`);
      console.log('');

      console.log('⏳ Calculating participant metrics...');
      const metrics =
        await challengeService.calculateAllParticipantMetrics(challengeId);

      console.log(`📈 Processed ${metrics.length} participants`);
      const qualified = metrics.filter(m => m.meetsRequirements);
      console.log(`✅ ${qualified.length} participants meet requirements`);
      console.log('');
    }

    console.log('🎯 Completing challenge and determining winners...');

    // Complete the challenge (will auto-calculate winners for sleep challenges)
    const result = await challengeService.completeChallenge(challengeId);

    console.log('✅ Challenge completed successfully!');
    console.log(`🏆 Winners (${result.winners.length}):`);
    result.winners.forEach((winner, index) => {
      console.log(`   ${index + 1}. ${winner}`);
    });
    console.log(`💰 Transaction Hash: ${result.transactionHash}`);
  } catch (error) {
    console.error('❌ Failed to finish challenge:', error.message);
    process.exit(1);
  }
}

// Get challenge ID from command line arguments
const challengeId = process.argv[2];

// Run if called directly
if (require.main === module) {
  finishChallenge(challengeId);
}

module.exports = { finishChallenge };
