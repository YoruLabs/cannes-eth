#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateChallenges() {
  console.log(
    '🔄 Updating challenges with better descriptions and requirements...'
  );

  try {
    // First, let's see what challenges exist
    const { data: challenges, error: fetchError } = await supabase
      .from('challenges')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching challenges:', fetchError);
      return;
    }

    console.log(`📋 Found ${challenges.length} challenges to update`);

    for (const challenge of challenges) {
      console.log(
        `\n🔧 Updating Challenge #${challenge.challenge_id}: ${challenge.title}`
      );

      let updatedDescription;
      let updatedRequirements;

      if (challenge.challenge_type === 'sleep_efficiency') {
        updatedDescription = `Demonstrate your commitment to quality sleep by maintaining an average sleep efficiency of ${challenge.target_value || 85}% or higher over a 7-day period. Sleep efficiency measures the percentage of time spent asleep while in bed.`;
        updatedRequirements = [
          'Achieve average sleep efficiency of 85% or higher',
          'Track sleep data for minimum 7 consecutive days',
          'Connect Terra fitness tracker to your account',
          'Maintain consistent sleep schedule throughout challenge period',
        ];
      } else {
        updatedDescription =
          'Complete your personalized health goals and demonstrate consistency in your wellness journey. Track your progress and compete with others committed to healthy living.';
        updatedRequirements = [
          'Complete daily health goals consistently',
          'Connect and sync your fitness tracking device',
          'Maintain activity throughout the challenge period',
          'Submit valid health data for verification',
        ];
      }

      // Update the challenge
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          description: updatedDescription,
          // Note: We're using the existing requirements field since challenge_requirements column might not exist yet
          requirements: {
            ...challenge.requirements,
            challengeRequirements: updatedRequirements,
            description: updatedDescription,
          },
        })
        .eq('challenge_id', challenge.challenge_id);

      if (updateError) {
        console.error(
          `❌ Error updating challenge ${challenge.challenge_id}:`,
          updateError
        );
      } else {
        console.log(`✅ Updated Challenge #${challenge.challenge_id}`);
      }
    }

    console.log('\n🎉 Challenge updates completed!');

    // Verify the updates
    console.log('\n📊 Verification - Updated challenges:');
    const { data: updatedChallenges, error: verifyError } = await supabase
      .from('challenges')
      .select('challenge_id, title, description, challenge_type, requirements');

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
    } else {
      updatedChallenges.forEach(challenge => {
        console.log(
          `\n📌 Challenge #${challenge.challenge_id}: ${challenge.title}`
        );
        console.log(`   Type: ${challenge.challenge_type}`);
        console.log(
          `   Description: ${challenge.description?.substring(0, 100)}...`
        );
        if (challenge.requirements?.challengeRequirements) {
          console.log(
            `   Requirements: ${challenge.requirements.challengeRequirements.length} items`
          );
        }
      });
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the update
updateChallenges();
