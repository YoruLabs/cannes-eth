#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const challengeService = require('../src/services/challengeService');

async function listChallenges() {
  try {
    console.log('📋 Listing all challenges...\n');

    const challenges = await challengeService.getAllChallenges();

    if (challenges.length === 0) {
      console.log('🔍 No challenges found');
      return;
    }

    console.log(`Found ${challenges.length} challenge(s):\n`);
    console.log('═'.repeat(80));

    challenges.forEach((challenge, index) => {
      console.log(`${index + 1}. Challenge #${challenge.id}`);
      console.log(`   Title: ${challenge.title}`);
      console.log(`   Status: ${challenge.status}`);
      console.log(`   Type: ${challenge.challengeType}`);
      console.log(`   Entry Fee: ${challenge.entryFee} WLD`);
      console.log(`   Participants: ${challenge.participantCount}`);

      if (challenge.metricType) {
        console.log(
          `   📊 Sleep Metric: ${challenge.metricType} (${challenge.targetValue} ${challenge.targetUnit})`
        );
      }

      if (challenge.canJoinNow) {
        console.log(`   🟢 Can join now!`);
      } else if (challenge.entryPeriodClosed) {
        console.log(`   🔴 Entry period closed`);
      } else if (challenge.isCurrentlyActive) {
        console.log(`   🟡 Challenge active`);
      } else if (challenge.shouldBeCompleted) {
        console.log(`   ⚪ Ready to complete`);
      }

      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to list challenges:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  listChallenges();
}

module.exports = { listChallenges };
