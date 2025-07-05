#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const challengeService = require('../src/services/challengeService');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function startChallenge(challengeId, mode = 'entry') {
  try {
    if (!challengeId) {
      console.error('❌ Please provide a challenge ID');
      console.log(
        'Usage: node scripts/start-challenge.js <challengeId> [mode]'
      );
      console.log('Modes:');
      console.log('  entry    - Start entry period (default)');
      console.log(
        '  challenge - Start challenge period (close entry, begin tracking)'
      );
      console.log(
        '  immediate - Start challenge immediately (skip entry period)'
      );
      process.exit(1);
    }

    console.log(`🚀 Starting challenge ${challengeId} in "${mode}" mode...\n`);

    // Get challenge details first
    const challenge = await challengeService.getChallengeDetails(challengeId);

    if (!challenge) {
      console.error(`❌ Challenge ${challengeId} not found`);
      process.exit(1);
    }

    console.log(`Challenge: ${challenge.title}`);
    console.log(`Current Status: ${challenge.status}`);
    console.log(
      `Entry Period: ${challenge.entryStartTime} to ${challenge.entryEndTime}`
    );
    console.log(
      `Challenge Period: ${challenge.challengeStartTime} to ${challenge.challengeEndTime}`
    );
    console.log('');

    const now = new Date();
    let updateData = {};

    if (mode === 'entry') {
      // Start entry period
      updateData = {
        status: 'entry_open',
        entry_start_time: now.toISOString(),
        entry_end_time: new Date(
          now.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // 24 hours from now
        started_at: now.toISOString(),
      };
      console.log('📝 Starting entry period (24 hours to join)');
    } else if (mode === 'challenge') {
      // Start challenge period (close entry)
      updateData = {
        status: 'active',
        challenge_start_time: now.toISOString(),
        challenge_end_time: new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days from now
      };
      console.log('📝 Starting challenge period (7 days of tracking)');
    } else if (mode === 'immediate') {
      // Start challenge immediately (skip entry period)
      updateData = {
        status: 'active',
        entry_start_time: now.toISOString(),
        entry_end_time: now.toISOString(), // Close entry immediately
        challenge_start_time: now.toISOString(),
        challenge_end_time: new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days from now
        started_at: now.toISOString(),
      };
      console.log('📝 Starting challenge immediately (no entry period)');
    } else {
      console.error(`❌ Invalid mode: ${mode}`);
      console.log('Valid modes: entry, challenge, immediate');
      process.exit(1);
    }

    // Update challenge in database
    const { error } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('challenge_id', challengeId);

    if (error) {
      throw new Error(`Failed to update challenge: ${error.message}`);
    }

    console.log('✅ Challenge updated successfully!');
    console.log(`📝 Status updated to: ${updateData.status}`);

    if (mode === 'entry') {
      console.log('🎯 Users can now join the challenge');
      console.log(`⏰ Entry closes at: ${updateData.entry_end_time}`);
    } else if (mode === 'challenge') {
      console.log('📊 Challenge tracking has begun');
      console.log(`⏰ Challenge ends at: ${updateData.challenge_end_time}`);
    } else if (mode === 'immediate') {
      console.log('🎯 Challenge is now active and tracking metrics');
      console.log(`⏰ Challenge ends at: ${updateData.challenge_end_time}`);
    }

    // Show updated challenge details
    console.log('\n📋 Updated Challenge Details:');
    const updatedChallenge =
      await challengeService.getChallengeDetails(challengeId);
    console.log(`Status: ${updatedChallenge.status}`);
    console.log(
      `Entry Period: ${updatedChallenge.entryStartTime} to ${updatedChallenge.entryEndTime}`
    );
    console.log(
      `Challenge Period: ${updatedChallenge.challengeStartTime} to ${updatedChallenge.challengeEndTime}`
    );
  } catch (error) {
    console.error('❌ Failed to start challenge:', error.message);
    process.exit(1);
  }
}

// Get challenge ID and mode from command line arguments
const challengeId = process.argv[2];
const mode = process.argv[3] || 'entry';

// Run if called directly
if (require.main === module) {
  startChallenge(challengeId, mode);
}

module.exports = { startChallenge };
