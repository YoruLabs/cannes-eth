#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const challengeService = require('../src/services/challengeService');

async function viewChallenge(challengeId) {
  try {
    if (!challengeId) {
      console.error('❌ Please provide a challenge ID');
      console.log('Usage: node scripts/view-challenge.js <challengeId>');
      process.exit(1);
    }

    console.log(`👀 Viewing challenge ${challengeId}...\n`);

    // Get challenge details
    const challenge = await challengeService.getChallengeDetails(challengeId);

    if (!challenge) {
      console.error(`❌ Challenge ${challengeId} not found`);
      process.exit(1);
    }

    // Display basic info
    console.log('📋 CHALLENGE DETAILS');
    console.log('═'.repeat(50));
    console.log(`Title: ${challenge.title}`);
    console.log(`Description: ${challenge.description}`);
    console.log(`Type: ${challenge.challengeType}`);
    console.log(`Status: ${challenge.status}`);
    console.log(`Entry Fee: ${challenge.entryFee} WLD`);
    console.log(`Total Pool: ${challenge.totalPool} WLD`);
    console.log(`Participants: ${challenge.participantCount}`);
    console.log(`Winners: ${challenge.winnerCount}`);
    console.log('');

    // Display time windows
    console.log('⏰ TIME WINDOWS');
    console.log('═'.repeat(50));
    if (challenge.entryStartTime && challenge.entryEndTime) {
      console.log(
        `Entry Period: ${challenge.entryStartTime} to ${challenge.entryEndTime}`
      );
      console.log(`Can Join Now: ${challenge.canJoinNow ? '✅' : '❌'}`);
      console.log(`Entry Closed: ${challenge.entryPeriodClosed ? '✅' : '❌'}`);
    }
    if (challenge.challengeStartTime && challenge.challengeEndTime) {
      console.log(
        `Challenge Period: ${challenge.challengeStartTime} to ${challenge.challengeEndTime}`
      );
      console.log(
        `Currently Active: ${challenge.isCurrentlyActive ? '✅' : '❌'}`
      );
      console.log(
        `Should Be Completed: ${challenge.shouldBeCompleted ? '✅' : '❌'}`
      );
    }
    console.log('');

    // Display sleep challenge specific info
    if (challenge.metricType) {
      console.log('📊 SLEEP CHALLENGE METRICS');
      console.log('═'.repeat(50));
      console.log(`Metric Type: ${challenge.metricType}`);
      console.log(`Calculation: ${challenge.metricCalculation}`);
      console.log(
        `Target Value: ${challenge.targetValue} ${challenge.targetUnit}`
      );
      console.log(`Comparison: ${challenge.comparisonOperator}`);
      console.log('');
    }

    // Display contract info
    console.log('🔗 BLOCKCHAIN INFO');
    console.log('═'.repeat(50));
    console.log(`Contract Active: ${challenge.isActive ? '✅' : '❌'}`);
    console.log(`Contract Completed: ${challenge.isCompleted ? '✅' : '❌'}`);
    console.log(`Creation TX: ${challenge.transactionHash}`);
    if (challenge.completionTransactionHash) {
      console.log(`Completion TX: ${challenge.completionTransactionHash}`);
    }
    console.log('');

    // Get and display participants
    try {
      const participants =
        await challengeService.getChallengeParticipants(challengeId);

      if (participants.length > 0) {
        console.log('👥 PARTICIPANTS');
        console.log('═'.repeat(50));
        participants.forEach((participant, index) => {
          console.log(`${index + 1}. ${participant.wallet_address}`);
          console.log(`   Status: ${participant.status}`);
          console.log(`   Joined: ${participant.joined_at}`);

          if (participant.calculated_metric_value !== null) {
            console.log(
              `   Metric Value: ${participant.calculated_metric_value}`
            );
            console.log(`   Data Points: ${participant.data_points_count}`);
            console.log(
              `   Meets Requirements: ${participant.meets_requirements ? '✅' : '❌'}`
            );
          }
          console.log('');
        });
      } else {
        console.log('👥 No participants yet');
        console.log('');
      }
    } catch (error) {
      console.log('👥 Could not fetch participants:', error.message);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to view challenge:', error.message);
    process.exit(1);
  }
}

// Get challenge ID from command line arguments
const challengeId = process.argv[2];

// Run if called directly
if (require.main === module) {
  viewChallenge(challengeId);
}

module.exports = { viewChallenge };
