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
  getChallengeData: (challengeId: number) => Promise<any>;
  getChallengeCounter: () => Promise<number>;
  getChallengeBlockchainData: (challengeId: number) => Promise<any>;
  getChallengeDatabaseData: (challengeId: number) => Promise<any>;
  getMultipleChallengeDatabaseData: (challengeIds: number[]) => Promise<any[]>;
  getCombinedChallengeData: (challengeId: number) => Promise<any>;
  getMultipleCombinedChallengeData: (challengeIds: number[]) => Promise<any[]>;
  joinChallenge: (challengeId: number, entryFee: string) => Promise<{ success: boolean; txId?: string; error?: string }>;
  completeChallenge: (challengeId: number) => Promise<{ success: boolean; txId?: string; error?: string }>;
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

  // Get challenge data from contract
  const getChallengeData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting challenge data for ID:', challengeId);
    
    // Return mock data in test environment
    if (isTestEnvironment) {
      return {
        id: challengeId,
        entryFee: '0.01',
        totalPool: '0.01',
        participantCount: 1,
        winnerCount: 1,
        isActive: false,
        isCompleted: true,
        name: `Challenge #${challengeId}`,
        description: 'Complete your health goals to win!',
        challengeType: 'health',
      };
    }

    try {
      const challenge = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'getChallengeDetails',
        args: [BigInt(challengeId)],
      });
      
      console.log('✅ Raw challenge data:', challenge);
      
      const challengeData = {
        id: Number(challenge[0]),
        entryFee: formatEther(challenge[1] as bigint),
        totalPool: formatEther(challenge[2] as bigint),
        participantCount: Number(challenge[3]),
        winnerCount: Number(challenge[4]),
        isActive: challenge[5],
        isCompleted: challenge[6],
        // Add default metadata
        name: `Challenge #${challengeId}`,
        description: 'Complete your health goals to win!',
        challengeType: 'health',
      };
      
      console.log('✅ Processed challenge data:', challengeData);
      return challengeData;
    } catch (error) {
      console.error('❌ Failed to get challenge data:', error);
      console.error('Challenge ID:', challengeId);
      console.error('Contract address:', HEALTH_CHALLENGE_ADDRESS);
      return null;
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
      
      return {
        id: Number(challenge[0]),
        entryFee: formatEther(challenge[1] as bigint),
        totalPool: formatEther(challenge[2] as bigint),
        participantCount: Number(challenge[3]),
        winnerCount: Number(challenge[4]),
        isActive: challenge[5],
        isCompleted: challenge[6],
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/challenges/db-only/${challengeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('❌ Failed to get database data:', error);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/challenges/db-only/batch/${challengeIds.join(',')}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('❌ Failed to get multiple database data:', error);
      return [];
    }
  }, []);

  // Combine blockchain and database data for a challenge
  const getCombinedChallengeData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting combined challenge data for ID:', challengeId);
    
    try {
      // Fetch both blockchain and database data in parallel
      const [blockchainData, databaseData] = await Promise.all([
        getChallengeBlockchainData(challengeId),
        getChallengeDatabaseData(challengeId),
      ]);

      if (!blockchainData) {
        console.error('❌ No blockchain data found for challenge:', challengeId);
        return null;
      }

      // Combine the data (database data takes precedence for metadata)
      const combinedData = {
        ...blockchainData,
        ...databaseData,
        // Ensure blockchain data for these fields
        entryFee: blockchainData.entryFee,
        totalPool: blockchainData.totalPool,
        participantCount: blockchainData.participantCount,
        winnerCount: blockchainData.winnerCount,
        isActive: blockchainData.isActive,
        isCompleted: blockchainData.isCompleted,
      };

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
      // Fetch database data for all challenges
      const databaseData = await getMultipleChallengeDatabaseData(challengeIds);
      
      // Fetch blockchain data for each challenge in parallel
      const blockchainPromises = challengeIds.map(id => getChallengeBlockchainData(id));
      const blockchainResults = await Promise.all(blockchainPromises);

      // Combine the data
      const combinedChallenges = challengeIds.map((challengeId, index) => {
        const blockchainData = blockchainResults[index];
        const dbData = databaseData.find((db: any) => db.id === challengeId);

        if (!blockchainData) {
          console.warn('❌ No blockchain data for challenge:', challengeId);
          return null;
        }

        return {
          ...blockchainData,
          ...dbData,
          // Ensure blockchain data for these fields
          entryFee: blockchainData.entryFee,
          totalPool: blockchainData.totalPool,
          participantCount: blockchainData.participantCount,
          winnerCount: blockchainData.winnerCount,
          isActive: blockchainData.isActive,
          isCompleted: blockchainData.isCompleted,
        };
      }).filter(Boolean); // Remove null entries

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
    getChallengeData,
    getChallengeCounter,
    getChallengeBlockchainData,
    getChallengeDatabaseData,
    getMultipleChallengeDatabaseData,
    getCombinedChallengeData,
    getMultipleCombinedChallengeData,
    joinChallenge,
    completeChallenge,
  };
}; 