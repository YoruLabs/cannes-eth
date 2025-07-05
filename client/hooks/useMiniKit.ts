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
    // Connection state
    isConnected,
    address,
    wldBalance,
    isLoading,
    
    // Contract functions
    getChallengeData,
    joinChallenge,
    completeChallenge,
  };
}; 