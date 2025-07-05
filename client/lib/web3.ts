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

// Contract addresses
export const HEALTH_CHALLENGE_ADDRESS = '0x73c455192547Feb273C000d8B9ee475bA7EabE49' as const;
export const WLD_TOKEN_ADDRESS = '0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4' as const;

// Contract ABIs (simplified for the functions we need)
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
    name: 'challenges',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'challengeType', type: 'string' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'totalPool', type: 'uint256' },
      { name: 'participantCount', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'isCompleted', type: 'bool' },
      { name: 'winnerCount', type: 'uint256' },
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
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_challengeType', type: 'string' },
      { name: '_entryFee', type: 'uint256' },
      { name: '_startTime', type: 'uint256' },
      { name: '_endTime', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeChallenge',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { name: '_signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'participants',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [
      { name: 'user', type: 'address' },
      { name: 'stakeAmount', type: 'uint256' },
      { name: 'hasCompleted', type: 'bool' },
      { name: 'hasWithdrawn', type: 'bool' },
      { name: 'joinedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
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
] as const; 