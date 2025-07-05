import { createPublicClient, createWalletClient, custom, http } from 'viem';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Custom World Chain Mainnet configuration
export const worldchainMainnet = {
  id: 480,
  name: 'World Chain Mainnet',
  network: 'worldchain-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://worldchain-mainnet.g.alchemy.com/public'],
    },
    public: {
      http: ['https://worldchain-mainnet.g.alchemy.com/public'],
    },
  },
  blockExplorers: {
    default: { name: 'WorldScan', url: 'https://worldscan.org' },
  },
} as const;

// Contract addresses for World Chain Mainnet
export const HEALTH_CHALLENGE_ADDRESS = '0xB36b82E2090D574Dfd5f3bCc835af09A3De8fb1F' as `0x${string}`;
export const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003' as `0x${string}`;

// Network configuration
export const NETWORK_CONFIG = {
  chain: worldchainMainnet,
  rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
  explorerUrl: 'https://worldscan.org',
} as const;

// Create public client for World Chain Mainnet
export const publicClient = createPublicClient({
  chain: worldchainMainnet,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});

// Create wallet client from window (MetaMask)
export const createWalletClientFromWindow = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: worldchainMainnet,
      transport: custom(window.ethereum),
    });
  }
  return null;
};

// Contract ABIs
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
    name: 'joinChallengeWithPermit2',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { 
        name: 'permit', 
        type: 'tuple',
        components: [
          {
            name: 'permitted',
            type: 'tuple',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ]
          },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      {
        name: 'transferDetails',
        type: 'tuple',
        components: [
          { name: 'to', type: 'address' },
          { name: 'requestedAmount', type: 'uint256' }
        ]
      },
      { name: 'signature', type: 'bytes' }
    ],
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