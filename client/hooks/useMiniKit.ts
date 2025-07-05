import { useState, useEffect, useCallback } from 'react';
import { formatEther } from 'viem';
import { MiniKit } from '@worldcoin/minikit-js';
import { createPublicClient, http } from 'viem';
import { 
  HEALTH_CHALLENGE_ADDRESS,
  WLD_TOKEN_ADDRESS,
  worldchainMainnet,
  HEALTH_CHALLENGE_ABI,
  WLD_TOKEN_ABI 
} from '../lib/web3';

interface UseMiniKitReturn {
  // Connection state
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  
  // Balances
  wldBalance: string;
  
  // Contract functions
  getChallengeCounter: () => Promise<number>;
  getChallengeBlockchainData: (challengeId: number) => Promise<any>;
  getChallengeDatabaseData: (challengeId: number) => Promise<any>;
  getMultipleChallengeDatabaseData: (challengeIds: number[]) => Promise<any[]>;
  getCombinedChallengeData: (challengeId: number) => Promise<any>;
  getMultipleCombinedChallengeData: (challengeIds: number[]) => Promise<any[]>;
  joinChallenge: (challengeId: number, entryFee: string) => Promise<{ success: boolean; txId?: string; error?: string }>;
  completeChallenge: (challengeId: number) => Promise<{ success: boolean; txId?: string; error?: string }>;
  checkParticipation: (challengeId: number, walletAddress: string) => Promise<boolean>;
}

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: worldchainMainnet,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});

// Check if we're in test environment
const isTestEnvironment = process.env.NEXT_PUBLIC_APP_ENV === 'test';

export const useMiniKit = (): UseMiniKitReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [wldBalance, setWldBalance] = useState('0');

  // Get connection state and address - handle test environment
  const isConnected = isTestEnvironment ? true : (MiniKit.isInstalled() && !!MiniKit.user?.walletAddress);
  const address = isTestEnvironment ? '0x1234567890123456789012345678901234567890' : (MiniKit.user?.walletAddress || null);

  // Get WLD balance
  const getWldBalance = useCallback(async (userAddress: string) => {
    // Return mock balance in test environment
    if (isTestEnvironment) {
      return '10.0';
    }

    try {
      const balance = await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS,
        abi: WLD_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });
      return formatEther(balance as bigint);
    } catch (error) {
      console.error('❌ Failed to get WLD balance:', error);
      return '0';
    }
  }, []);

  // Get challenge counter from blockchain
  const getChallengeCounter = useCallback(async () => {
    console.log('🔍 Getting challenge counter from blockchain');
    
    if (isTestEnvironment) {
      return 3; // Mock counter
    }

    try {
      const counter = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'challengeCounter',
      });
      
      const counterNumber = Number(counter);
      console.log('✅ Challenge counter:', counterNumber);
      return counterNumber;
    } catch (error) {
      console.error('❌ Failed to get challenge counter:', error);
      return 0;
    }
  }, []);

  // Get blockchain data for a challenge
  const getChallengeBlockchainData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting blockchain data for challenge:', challengeId);
    
    if (isTestEnvironment) {
      return {
        id: challengeId,
        entryFee: '0.01',
        totalPool: challengeId === 1 ? '0.01' : '0',
        participantCount: challengeId === 1 ? 1 : 0,
        winnerCount: challengeId === 1 ? 1 : 0,
        isActive: true,
        isCompleted: challengeId === 1,
      };
    }

    try {
      const challenge = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'getChallengeDetails',
        args: [BigInt(challengeId)],
      });
      
      console.log('✅ Raw blockchain data:', challenge);
      
      return {
        id: Number(challenge[0]),
        entryFee: formatEther(challenge[1] as bigint),
        totalPool: formatEther(challenge[2] as bigint),
        participantCount: Number(challenge[3]),
        winnerCount: Number(challenge[4]),
        isActive: challenge[5] as boolean,
        isCompleted: challenge[6] as boolean,
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain data:', error);
      return null;
    }
  }, []);

  // Get database data for a challenge from server
  const getChallengeDatabaseData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting database data for challenge:', challengeId);
    
    if (isTestEnvironment) {
      return {
        id: challengeId,
        title: challengeId === 2 ? 'Challenge #2' : 'Sleep Efficiency Master',
        description: challengeId === 2 ? 'Complete your health goals to win!' : 'Achieve an average sleep efficiency of 85% or higher over 7 days',
        challengeType: challengeId === 2 ? 'health' : 'sleep_efficiency',
        status: 'created',
        canJoinNow: challengeId === 3,
        metricType: challengeId === 3 ? 'sleep_efficiency' : null,
        targetValue: challengeId === 3 ? 85 : null,
        targetUnit: challengeId === 3 ? 'percentage' : null,
      };
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!serverUrl) {
        throw new Error('NEXT_PUBLIC_SERVER_URL environment variable is not set');
      }

      const url = `${serverUrl}/api/challenges/db-only/${challengeId}`;
      console.log('📡 Fetching from URL:', url);

      const response = await fetch(url);
      
      console.log('📊 Database fetch response status:', response.status);
      console.log('📊 Database fetch response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Database fetch error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Database response:', data);
      
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Database fetch failed with detailed error:', {
        challengeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        note: 'Using fallback data instead'
      });
      return null;
    }
  }, []);

  // Get multiple challenges database data from server
  const getMultipleChallengeDatabaseData = useCallback(async (challengeIds: number[]) => {
    console.log('🔍 Getting database data for multiple challenges:', challengeIds);
    
    if (isTestEnvironment) {
      return challengeIds.map(id => ({
        id,
        title: id === 2 ? 'Challenge #2' : 'Sleep Efficiency Master',
        description: id === 2 ? 'Complete your health goals to win!' : 'Achieve an average sleep efficiency of 85% or higher over 7 days',
        challengeType: id === 2 ? 'health' : 'sleep_efficiency',
        status: 'created',
        canJoinNow: id === 3,
        metricType: id === 3 ? 'sleep_efficiency' : null,
        targetValue: id === 3 ? 85 : null,
        targetUnit: id === 3 ? 'percentage' : null,
      }));
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!serverUrl) {
        throw new Error('NEXT_PUBLIC_SERVER_URL environment variable is not set');
      }

      const url = `${serverUrl}/api/challenges/db-only/batch/${challengeIds.join(',')}`;
      console.log('📡 Fetching from URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Database response:', data);
      
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('⚠️ Database fetch failed, using fallback data:', {
        error: error instanceof Error ? error.message : String(error),
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
        challengeIds: challengeIds,
        note: 'This is expected if some challenges only exist on blockchain'
      });
      
      // Return empty array instead of throwing, so the app can continue with fallback data
      return [];
    }
  }, []);

  // Combine blockchain and database data for a challenge
  const getCombinedChallengeData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting combined challenge data for ID:', challengeId);
    
    try {
      // Fetch blockchain data first
      const blockchainData = await getChallengeBlockchainData(challengeId);
      
      if (!blockchainData) {
        console.error('❌ No blockchain data found for challenge:', challengeId);
        return null;
      }

      // Try to fetch database data, but don't fail if it's not available
      let databaseData = null;
      try {
        databaseData = await getChallengeDatabaseData(challengeId);
      } catch (error) {
        console.info('ℹ️ Database data not available for challenge, using fallback:', challengeId);
        databaseData = null;
      }

      // Helper methods for fallback data
      const getDefaultDescription = (challengeType: string) => {
        switch (challengeType) {
          case 'sleep_efficiency':
            return 'Demonstrate your commitment to quality sleep by maintaining an average sleep efficiency of 85% or higher over a 7-day period. Sleep efficiency measures the percentage of time spent asleep while in bed.';
          case 'sleep_duration':
            return 'Prioritize your sleep health by achieving an average of 9 hours of sleep per night over a 7-day period. Consistent, adequate sleep is fundamental to overall wellness.';
          case 'health':
          default:
            return 'Complete your personalized health goals and demonstrate consistency in your wellness journey. Track your progress and compete with others committed to healthy living.';
        }
      };

      const getDefaultRequirements = (challengeType: string) => {
        switch (challengeType) {
          case 'sleep_efficiency':
            return [
              'Achieve average sleep efficiency of 85% or higher',
              'Track sleep data for minimum 7 consecutive days',
              'Connect Terra fitness tracker to your account',
              'Maintain consistent sleep schedule throughout challenge period'
            ];
          case 'sleep_duration':
            return [
              'Sleep minimum 9 hours per night on average',
              'Track sleep data for minimum 7 consecutive days',
              'Connect Terra fitness tracker to your account',
              'Maintain consistent bedtime and wake-up schedule'
            ];
          case 'health':
          default:
            return [
              'Complete daily health goals consistently',
              'Connect and sync your fitness tracking device',
              'Maintain activity throughout the challenge period',
              'Submit valid health data for verification'
            ];
        }
      };

      // Create fallback data for challenges without database entries
      const fallbackData = {
        id: challengeId,
        title: `Challenge #${challengeId}`,
        description: getDefaultDescription('health'), // Default to health type
        challengeType: 'health',
        status: 'created',
        canJoinNow: true,
        challengeRequirements: getDefaultRequirements('health'), // Default to health type
      };

      // Combine the data (database data takes precedence for metadata)
      const combinedData = {
        ...fallbackData,
        ...blockchainData,
        ...databaseData,
        // Ensure blockchain data for these critical fields
        entryFee: blockchainData.entryFee,
        totalPool: blockchainData.totalPool,
        participantCount: blockchainData.participantCount,
        winnerCount: blockchainData.winnerCount,
        isActive: blockchainData.isActive,
        isCompleted: blockchainData.isCompleted,
      };

      // Add challenge lifecycle status calculations
      const now = new Date();
      const entryStartTime = databaseData?.entryStartTime ? new Date(databaseData.entryStartTime) : null;
      const entryEndTime = databaseData?.entryEndTime ? new Date(databaseData.entryEndTime) : null;
      const challengeStartTime = databaseData?.challengeStartTime ? new Date(databaseData.challengeStartTime) : null;
      const challengeEndTime = databaseData?.challengeEndTime ? new Date(databaseData.challengeEndTime) : null;

      // Calculate status flags
      const entryPeriodOpen = entryStartTime && entryEndTime && now >= entryStartTime && now <= entryEndTime;
      const entryPeriodClosed = entryEndTime && now > entryEndTime;
      const isCurrentlyActive = challengeStartTime && challengeEndTime && now >= challengeStartTime && now <= challengeEndTime;
      const shouldBeCompleted = challengeEndTime && now > challengeEndTime;

      // Add status information
      combinedData.canJoinNow = entryPeriodOpen && !combinedData.isCompleted;
      combinedData.entryPeriodClosed = entryPeriodClosed;
      combinedData.isCurrentlyActive = isCurrentlyActive;
      combinedData.shouldBeCompleted = shouldBeCompleted;
      combinedData.entryStartTime = entryStartTime;
      combinedData.entryEndTime = entryEndTime;
      combinedData.challengeStartTime = challengeStartTime;
      combinedData.challengeEndTime = challengeEndTime;

      console.log('✅ Combined challenge data:', combinedData);
      return combinedData;
    } catch (error) {
      console.error('❌ Failed to get combined challenge data:', error);
      return null;
    }
  }, [getChallengeBlockchainData, getChallengeDatabaseData]);

  // Get multiple challenges with combined data
  const getMultipleCombinedChallengeData = useCallback(async (challengeIds: number[]) => {
    console.log('🔍 Getting combined data for multiple challenges:', challengeIds);
    
    try {
      // Fetch blockchain data for each challenge in parallel
      const blockchainPromises = challengeIds.map(id => getChallengeBlockchainData(id));
      const blockchainResults = await Promise.all(blockchainPromises);

      // Filter out null results (challenges that don't exist on blockchain)
      const validChallenges = challengeIds.filter((_, index) => blockchainResults[index] !== null);
      const validBlockchainData = blockchainResults.filter(result => result !== null);

      if (validChallenges.length === 0) {
        console.log('ℹ️ No valid challenges found on blockchain');
        return [];
      }

      // Fetch database data for valid challenges
      let databaseData = [];
      try {
        databaseData = await getMultipleChallengeDatabaseData(validChallenges);
      } catch (error) {
        console.info('ℹ️ Using fallback data for challenges without database entries:', error);
        databaseData = [];
      }

      // Combine the data
      const combinedChallenges = validChallenges.map((challengeId, index) => {
        const blockchainData = validBlockchainData[index];
        const dbData = databaseData.find((db: any) => db.id === challengeId);

        // Helper methods for fallback data
        const getDefaultDescription = (challengeType: string) => {
          switch (challengeType) {
            case 'sleep_efficiency':
              return 'Demonstrate your commitment to quality sleep by maintaining an average sleep efficiency of 85% or higher over a 7-day period.';
            case 'sleep_duration':
              return 'Prioritize your sleep health by achieving an average of 9 hours of sleep per night over a 7-day period.';
            case 'health':
            default:
              return 'Complete your personalized health goals and demonstrate consistency in your wellness journey.';
          }
        };

        const getDefaultRequirements = (challengeType: string) => {
          switch (challengeType) {
            case 'sleep_efficiency':
              return [
                'Achieve average sleep efficiency of 85% or higher',
                'Track sleep data for minimum 7 consecutive days',
                'Connect Terra fitness tracker to your account',
                'Maintain consistent sleep schedule throughout challenge period'
              ];
            case 'sleep_duration':
              return [
                'Sleep minimum 9 hours per night on average',
                'Track sleep data for minimum 7 consecutive days',
                'Connect Terra fitness tracker to your account',
                'Maintain consistent bedtime and wake-up schedule'
              ];
            case 'health':
            default:
              return [
                'Complete daily health goals consistently',
                'Connect and sync your fitness tracking device',
                'Maintain activity throughout the challenge period',
                'Submit valid health data for verification'
              ];
          }
        };

        // Create fallback data for challenges without database entries
        const fallbackData = {
          id: challengeId,
          title: `Challenge #${challengeId}`,
          description: getDefaultDescription('health'), // Default to health type
          challengeType: 'health',
          status: 'created',
          canJoinNow: true,
          challengeRequirements: getDefaultRequirements('health'), // Default to health type
        };

        // Add challenge lifecycle status calculations
        const now = new Date();
        const entryStartTime = dbData?.entryStartTime ? new Date(dbData.entryStartTime) : null;
        const entryEndTime = dbData?.entryEndTime ? new Date(dbData.entryEndTime) : null;
        const challengeStartTime = dbData?.challengeStartTime ? new Date(dbData.challengeStartTime) : null;
        const challengeEndTime = dbData?.challengeEndTime ? new Date(dbData.challengeEndTime) : null;

        // Calculate status flags
        const entryPeriodOpen = entryStartTime && entryEndTime && now >= entryStartTime && now <= entryEndTime;
        const entryPeriodClosed = entryEndTime && now > entryEndTime;
        const isCurrentlyActive = challengeStartTime && challengeEndTime && now >= challengeStartTime && now <= challengeEndTime;
        const shouldBeCompleted = challengeEndTime && now > challengeEndTime;

        // Add status information
        const combinedData = {
          ...fallbackData,
          ...blockchainData,
          ...dbData,
          // Ensure blockchain data for these critical fields
          entryFee: blockchainData.entryFee,
          totalPool: blockchainData.totalPool,
          participantCount: blockchainData.participantCount,
          winnerCount: blockchainData.winnerCount,
          isActive: blockchainData.isActive,
          isCompleted: blockchainData.isCompleted,
        };
        combinedData.canJoinNow = entryPeriodOpen && !combinedData.isCompleted;
        combinedData.entryPeriodClosed = entryPeriodClosed;
        combinedData.isCurrentlyActive = isCurrentlyActive;
        combinedData.shouldBeCompleted = shouldBeCompleted;
        combinedData.entryStartTime = entryStartTime;
        combinedData.entryEndTime = entryEndTime;
        combinedData.challengeStartTime = challengeStartTime;
        combinedData.challengeEndTime = challengeEndTime;

        return combinedData;
      });

      console.log('✅ Combined multiple challenge data:', combinedChallenges);
      return combinedChallenges;
    } catch (error) {
      console.error('❌ Failed to get multiple combined challenge data:', error);
      return [];
    }
  }, [getChallengeBlockchainData, getMultipleChallengeDatabaseData]);

  // Join challenge using MiniKit
  const joinChallenge = useCallback(async (challengeId: number, stakeAmount: string) => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Return mock success in test environment
    if (isTestEnvironment) {
      console.log('🧪 Mock joining challenge in test environment');
      return { success: true, txId: 'mock-tx-id-' + Date.now() };
    }

    try {
      setIsLoading(true);
      console.log('🚀 Joining challenge with MiniKit using Permit2...');

      // Convert stake amount to wei
      const stakeAmountWei = (parseFloat(stakeAmount) * 10**18).toString();
      
      // Create permit2 transfer for WLD tokens
      const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(); // 30 minutes from now
      
      const permitTransfer = {
        permitted: {
          token: WLD_TOKEN_ADDRESS,
          amount: stakeAmountWei,
        },
        nonce: Date.now().toString(),
        deadline,
      };

      // Transfer details - send to our health challenge contract
      const transferDetails = {
        to: HEALTH_CHALLENGE_ADDRESS,
        requestedAmount: stakeAmountWei,
      };

      // Call the new joinChallengeWithPermit2 function
      const joinTransaction = {
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'joinChallengeWithPermit2',
        args: [
          challengeId.toString(),
          permitTransfer,
          transferDetails,
          'PERMIT2_SIGNATURE_PLACEHOLDER_0'
        ],
      };

      // Send transaction with permit2
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [joinTransaction],
        permit2: [
          {
            ...permitTransfer,
            spender: HEALTH_CHALLENGE_ADDRESS,
          },
        ],
      });

      if (finalPayload.status === 'error') {
        console.error('❌ Transaction failed:', finalPayload);
        
        // Check if it's a permission error
        if (finalPayload.error_code === 'disallowed_operation') {
          return { 
            success: false, 
            error: 'Transaction contains disallowed operations. Make sure WLD token and contract are configured in World Developer Portal.' 
          };
        }
        
        return { success: false, error: 'Transaction failed' };
      }

      console.log('✅ Transaction sent:', finalPayload.transaction_id);

      // Record participation in database after successful transaction
      try {
        await recordChallengeParticipation(challengeId, address, finalPayload.transaction_id);
        console.log('✅ Participation recorded in database');
      } catch (dbError) {
        console.warn('⚠️ Failed to record participation in database:', dbError);
        // Don't fail the whole operation if database recording fails
      }

      return { success: true, txId: finalPayload.transaction_id };

    } catch (error) {
      console.error('❌ Failed to join challenge:', error);
      
      // Check for specific permission errors
      if (error instanceof Error && error.message.includes('disallowed_operation')) {
        return { 
          success: false, 
          error: 'Transaction contains disallowed operations. Make sure contracts and tokens are configured in World Developer Portal.' 
        };
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Record challenge participation in database
  const recordChallengeParticipation = useCallback(async (challengeId: number, walletAddress: string, transactionHash: string) => {
    if (isTestEnvironment) {
      console.log('🧪 Mock recording participation in test environment');
      return;
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!serverUrl) {
        throw new Error('NEXT_PUBLIC_SERVER_URL environment variable is not set');
      }

      console.log('📡 Recording participation:', {
        serverUrl,
        challengeId,
        walletAddress,
        transactionHash
      });

      const response = await fetch(`${serverUrl}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          transactionHash,
        }),
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Participation recorded:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to record participation:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }, []);

  // Complete challenge using MiniKit
  const completeChallenge = useCallback(async (challengeId: number) => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Return mock success in test environment
    if (isTestEnvironment) {
      console.log('🧪 Mock completing challenge in test environment');
      return { success: true, txId: 'mock-complete-tx-id-' + Date.now() };
    }

    try {
      setIsLoading(true);
      console.log('🏆 Completing challenge with MiniKit...');

      // For now, we'll use a simple completion without signature verification
      // In production, you'd need to implement backend signature generation
      const mockWinners = [address as `0x${string}`];
      const mockSignature = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

      const completeTransaction = {
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'completeChallenge',
        args: [BigInt(challengeId), mockWinners, mockSignature],
      };

      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [completeTransaction],
      });

      if (finalPayload.status === 'error') {
        console.error('❌ Transaction failed:', finalPayload);
        
        // Check if it's a permission error
        if (finalPayload.error_code === 'disallowed_operation') {
          return { 
            success: false, 
            error: 'Transaction permission not enabled. Please enable "Send Transaction" permission in World Developer Portal for your app.' 
          };
        }
        
        return { success: false, error: 'Transaction failed' };
      }

      console.log('✅ Challenge completed:', finalPayload.transaction_id);
      return { success: true, txId: finalPayload.transaction_id };

    } catch (error) {
      console.error('❌ Failed to complete challenge:', error);
      
      // Check for specific permission errors
      if (error instanceof Error && error.message.includes('disallowed_operation')) {
        return { 
          success: false, 
          error: 'App permissions not configured. Please enable transaction permissions in World Developer Portal.' 
        };
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Check if user is participating in a challenge
  const checkParticipation = useCallback(async (challengeId: number, walletAddress: string) => {
    if (isTestEnvironment) {
      console.log('🧪 Mock checking participation in test environment');
      return false; // Always allow joining in test mode
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!serverUrl) {
        throw new Error('NEXT_PUBLIC_SERVER_URL environment variable is not set');
      }

      const response = await fetch(`${serverUrl}/api/challenges/${challengeId}/participation/${walletAddress}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Participation check result:', data);
      
      return data.success ? data.data.isParticipating : false;
    } catch (error) {
      console.error('❌ Failed to check participation:', error);
      return false; // Default to false if check fails
    }
  }, []);

  // Update balance when address changes
  useEffect(() => {
    if (address) {
      getWldBalance(address).then(setWldBalance);
    }
  }, [address, getWldBalance]);

  return {
    isConnected,
    address,
    wldBalance,
    isLoading,
    getChallengeCounter,
    getChallengeBlockchainData,
    getChallengeDatabaseData,
    getMultipleChallengeDatabaseData,
    getCombinedChallengeData,
    getMultipleCombinedChallengeData,
    joinChallenge,
    completeChallenge,
    checkParticipation,
  };
}; 