require('dotenv').config();
const challengeService = require('./src/services/challengeService');
const logger = require('./src/config/logger');

async function testChallengeService() {
  try {
    console.log('🧪 Testing Challenge Service...\n');

    // Test 1: Get all challenges
    console.log('1. Getting all challenges...');
    const allChallenges = await challengeService.getAllChallenges();
    console.log(`Found ${allChallenges.length} challenges:`, allChallenges);
    console.log('✅ Get all challenges - PASSED\n');

    // Test 2: Get specific challenge details
    if (allChallenges.length > 0) {
      const challengeId = allChallenges[0].id;
      console.log(`2. Getting challenge details for ID: ${challengeId}...`);
      const challengeDetails =
        await challengeService.getChallengeDetails(challengeId);
      console.log('Challenge details:', challengeDetails);
      console.log('✅ Get challenge details - PASSED\n');

      // Test 3: Get challenge participants
      console.log(
        `3. Getting participants for challenge ID: ${challengeId}...`
      );
      const participants =
        await challengeService.getChallengeParticipants(challengeId);
      console.log(`Found ${participants.length} participants:`, participants);
      console.log('✅ Get challenge participants - PASSED\n');

      // Test 4: Check if a specific address is participating
      const testAddress = '0x6B84Bba6e67a124093933abA8F5b6bEB96307D99';
      console.log(`4. Checking if ${testAddress} is participating...`);
      const isParticipating = await challengeService.isParticipating(
        challengeId,
        testAddress
      );
      console.log(`Is participating: ${isParticipating}`);
      console.log('✅ Check participation - PASSED\n');
    }

    // Test 5: Create a new challenge (commented out to avoid creating unnecessary challenges)
    /*
    console.log('5. Creating a new challenge...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    
    const newChallenge = await challengeService.createChallenge({
      title: 'Test Challenge',
      description: 'A test challenge created by the test script',
      entryFee: '0.005',
      challengeType: 'steps',
      deadline: futureDate.toISOString(),
      requirements: {
        daily_steps: 8000,
        consecutive_days: 7
      },
      winnerCount: 1
    });
    console.log('New challenge created:', newChallenge);
    console.log('✅ Create challenge - PASSED\n');
    */

    console.log('🎉 All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Challenge service test failed', { error: error.message });
  }
}

// Run the test
testChallengeService();
