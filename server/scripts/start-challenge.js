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

async function startChallenge(challengeId) {
  try {
    if (!challengeId) {
      console.error('❌ Please provide a challenge ID');
      console.log('Usage: node scripts/start-challenge.js <challengeId>');
      process.exit(1);
    }

    console.log(`🚀 Starting challenge ${challengeId}...\n`);

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
    console.log('');

    // Update status to entry_open
    const { error } = await supabase
      .from('challenges')
      .update({
        status: 'entry_open',
        started_at: new Date().toISOString(),
      })
      .eq('challenge_id', challengeId);

    if (error) {
      throw new Error(`Failed to update challenge status: ${error.message}`);
    }

    console.log('✅ Challenge started successfully!');
    console.log('📝 Status updated to: entry_open');
    console.log('🎯 Users can now join the challenge');
  } catch (error) {
    console.error('❌ Failed to start challenge:', error.message);
    process.exit(1);
  }
}

// Get challenge ID from command line arguments
const challengeId = process.argv[2];

// Run if called directly
if (require.main === module) {
  startChallenge(challengeId);
}

module.exports = { startChallenge };
