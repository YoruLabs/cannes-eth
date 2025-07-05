import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { defineChain } from 'viem';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define World Chain Sepolia
export const worldChainSepolia = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  network: 'worldchain-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://worldchain-sepolia.g.alchemy.com/public'],
    },
    public: {
      http: ['https://worldchain-sepolia.g.alchemy.com/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'World Chain Sepolia Explorer',
      url: 'https://worldchain-sepolia.explorer.alchemy.com',
    },
  },
  testnet: true,
});

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: worldChainSepolia,
  transport: http(),
});

// Create wallet client for transactions (will be created with window.ethereum)
export const createWalletClientFromWindow = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: worldChainSepolia,
      transport: custom(window.ethereum),
    });
  }
  return null;
};

// Contract addresses - Updated with new deployment
export const HEALTH_CHALLENGE_ADDRESS = '0x79399A62F79484171c9a324833F01Bf62a4E1f98' as const;
export const WLD_TOKEN_ADDRESS = '0xAb9f2cdB64F838557050c397f5fBE42A145C6C61' as const;

// Contract ABIs - Updated for simplified contract
export const HEALTH_CHALLENGE_ABI = [
  {
    type: 'function',
    name: 'challengeCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getChallengeDetails',
    inputs: [{ name: '_challengeId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'totalPool', type: 'uint256' },
      { name: 'participantCount', type: 'uint256' },
      { name: 'winnerCount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'isCompleted', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'joinChallenge',
    inputs: [{ name: '_challengeId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'createChallenge',
    inputs: [{ name: '_entryFee', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeChallenge',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { name: '_winners', type: 'address[]' },
      { name: '_signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelChallenge',
    inputs: [{ name: '_challengeId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getChallengeParticipants',
    inputs: [{ name: '_challengeId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getChallengeWinners',
    inputs: [{ name: '_challengeId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isParticipant',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isWinner',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserChallenges',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'updateBackendSigner',
    inputs: [{ name: '_newSigner', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'backendSigner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'ChallengeCreated',
    inputs: [
      { name: 'challengeId', type: 'uint256', indexed: true },
      { name: 'entryFee', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'UserJoinedChallenge',
    inputs: [
      { name: 'challengeId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ChallengeCompleted',
    inputs: [
      { name: 'challengeId', type: 'uint256', indexed: true },
      { name: 'winnerCount', type: 'uint256', indexed: false },
      { name: 'prizePerWinner', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WinnerVerified',
    inputs: [
      { name: 'challengeId', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'prize', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const WLD_TOKEN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const; 