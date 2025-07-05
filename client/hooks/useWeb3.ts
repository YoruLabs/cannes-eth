import { useState, useEffect, useCallback } from 'react';
import { formatEther, parseEther, keccak256, encodePacked } from 'viem';
import { 
  publicClient,
  createWalletClientFromWindow, 
  HEALTH_CHALLENGE_ADDRESS,
  WLD_TOKEN_ADDRESS,
  HEALTH_CHALLENGE_ABI,
  WLD_TOKEN_ABI 
} from '../lib/web3';
import { privateKeyToAccount } from 'viem/accounts';

interface UseWeb3Return {
  // Connection state
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  isManualConnection: boolean;
  
  // Balances
  wldBalance: string;
  
  // Connection functions
  connectWallet: () => Promise<void>;
  connectDeployerAddress: () => void;
  disconnectWallet: () => void;
  
  // Contract functions
  getChallengeData: (challengeId: number) => Promise<any>;
  joinChallenge: (challengeId: number, entryFee: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  completeChallenge: (challengeId: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
}

export const useWeb3 = (): UseWeb3Return => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualConnection, setIsManualConnection] = useState(false);
  const [wldBalance, setWldBalance] = useState('0');

  // Manual address connection (for testing)
  const connectManualAddress = useCallback((manualAddress: string) => {
    setAddress(manualAddress);
    setIsConnected(true);
    setIsManualConnection(true);
  }, []);

  // Connect to deployer address (has 1M WLD tokens)
  const connectDeployerAddress = useCallback(() => {
    const deployerAddress = '0xeB780C963C700639f16CD09b4CF4F5c6Bc952730';
    connectManualAddress(deployerAddress);
  }, [connectManualAddress]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAddress('');
    setIsConnected(false);
    setIsManualConnection(false);
    setWldBalance('0');
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setIsManualConnection(false);
        
        // Switch to World Chain Mainnet if not already
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1E0' }], // 480 in hex
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x1E0', // 480 in hex
                  chainName: 'World Chain Mainnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://worldchain-mainnet.g.alchemy.com/public'],
                  blockExplorerUrls: ['https://worldscan.org'],
                }],
              });
            } catch (addError) {
              console.error('Failed to add network:', addError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  // Get WLD balance
  const getWldBalance = useCallback(async (userAddress: string) => {
    try {
      const balance = await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS,
        abi: WLD_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });
      return formatEther(balance as bigint);
    } catch (error) {
      console.error('Failed to get WLD balance:', error);
      return '0';
    }
  }, [WLD_TOKEN_ABI, WLD_TOKEN_ADDRESS]);

  // Get challenge data from contract
  const getChallengeData = useCallback(async (challengeId: number) => {
    console.log('🔍 Getting challenge data for ID:', challengeId);
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
        // Add default metadata since it's not in the contract anymore
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
  }, [HEALTH_CHALLENGE_ABI, HEALTH_CHALLENGE_ADDRESS]);

  // Join challenge
  const joinChallenge = useCallback(async (challengeId: number, stakeAmount: string) => {
    if (isManualConnection) {
      // For manual connections, simulate success but warn user
      alert('Manual connection detected. In a real app, you would need to use your actual wallet to sign transactions.');
      return { success: false, error: 'Manual connection - transactions not supported' };
    }

    try {
      setIsLoading(true);
      
      const walletClient = createWalletClientFromWindow();
      if (!walletClient || !address) {
        throw new Error('Wallet not connected');
      }

      const stakeAmountWei = parseEther(stakeAmount);

      // First, check allowance
      const allowance = await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS,
        abi: WLD_TOKEN_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, HEALTH_CHALLENGE_ADDRESS],
      });

      // If allowance is insufficient, approve first
      if ((allowance as bigint) < stakeAmountWei) {
        console.log('Approving WLD tokens...');
        const approveTx = await walletClient.writeContract({
          address: WLD_TOKEN_ADDRESS,
          abi: WLD_TOKEN_ABI,
          functionName: 'approve',
          args: [HEALTH_CHALLENGE_ADDRESS, stakeAmountWei],
          account: address as `0x${string}`,
        });
        
        // Wait for approval transaction
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log('Approval successful:', approveTx);
      }

      // Now join the challenge
      console.log('Joining challenge...');
      const joinTx = await walletClient.writeContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'joinChallenge',
        args: [BigInt(challengeId)],
        account: address as `0x${string}`,
      });

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash: joinTx });
      console.log('Join successful:', receipt);
      
      return { success: true, txHash: joinTx };
    } catch (error) {
      console.error('Failed to join challenge:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [address, isManualConnection, HEALTH_CHALLENGE_ADDRESS, HEALTH_CHALLENGE_ABI, WLD_TOKEN_ABI, WLD_TOKEN_ADDRESS]);

  // Complete challenge (with proper signature generation)
  const completeChallenge = useCallback(async (challengeId: number) => {
    if (isManualConnection) {
      // For manual connections, simulate success but warn user
      alert('Manual connection detected. In a real app, you would need to use your actual wallet to sign transactions.');
      return { success: false, error: 'Manual connection - transactions not supported' };
    }

    try {
      setIsLoading(true);
      
      const walletClient = createWalletClientFromWindow();
      if (!walletClient || !address) {
        throw new Error('Wallet not connected');
      }

      // Winners array - current user as winner
      const mockWinners = [address as `0x${string}`];
      
      // Create message hash - this matches the contract's logic:
      // bytes32 messageHash = keccak256(abi.encodePacked(_challengeId, _winners));
      const messageHash = keccak256(
        encodePacked(
          ['uint256', 'address[]'],
          [BigInt(challengeId), mockWinners]
        )
      );

      // Get the backend signer's private key from environment variable
      const backendPrivateKey = process.env.NEXT_PUBLIC_BACKEND_PRIVATE_KEY;
      if (!backendPrivateKey) {
        throw new Error('Backend private key not found in environment variables');
      }
      
      // Create account from private key for signing
      const backendAccount = privateKeyToAccount(backendPrivateKey as `0x${string}`);
      
      // Sign the message hash using the backend account
      const signature = await backendAccount.signMessage({
        message: { raw: messageHash },
      });

      const completeTx = await walletClient.writeContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'completeChallenge',
        args: [BigInt(challengeId), mockWinners, signature],
        account: address as `0x${string}`,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: completeTx });
      console.log('Complete challenge successful:', receipt);
      
      return { success: true, txHash: completeTx };
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  }, [address, isManualConnection, HEALTH_CHALLENGE_ADDRESS, HEALTH_CHALLENGE_ABI]);

  // Update balance when address changes
  useEffect(() => {
    if (address) {
      getWldBalance(address).then(setWldBalance);
    }
  }, [address, getWldBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && !isManualConnection) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            setIsManualConnection(false);
          }
        } catch (error) {
          console.error('Failed to check connection:', error);
        }
      }
    };

    checkConnection();
  }, [isManualConnection]);

  return {
    // Connection state
    isConnected,
    address,
    wldBalance,
    isLoading,
    isManualConnection,
    connectWallet,
    connectDeployerAddress,
    disconnectWallet,
    getChallengeData,
    joinChallenge,
    completeChallenge,
  };
}; 