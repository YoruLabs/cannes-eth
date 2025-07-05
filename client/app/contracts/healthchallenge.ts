import healthChallengeABI from './healthchallenge_abi.json';

export const HEALTH_CHALLENGE_CONTRACT = {
  // World Chain Sepolia Testnet
  address: '0x73c455192547Feb273C000d8B9ee475bA7EabE49' as `0x${string}`,
  abi: healthChallengeABI,
  chainId: 4801,
  network: 'World Chain Sepolia',
  blockExplorer: 'https://worldchain-sepolia.explorer.alchemy.com',
  rpcUrl: 'https://worldchain-sepolia.g.alchemy.com/public',
} as const;

export const WLD_TOKEN_CONTRACT = {
  address: '0xb37C19bD9bB9569B09f4e91C5C9E4413141b5ED4' as `0x${string}`,
  symbol: 'WLD',
  decimals: 18,
  chainId: 4801,
} as const;

export const NETWORK_CONFIG = {
  worldChainSepolia: {
    chainId: 4801,
    name: 'World Chain Sepolia',
    rpcUrl: 'https://worldchain-sepolia.g.alchemy.com/public',
    blockExplorer: 'https://worldchain-sepolia.explorer.alchemy.com',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  worldChainMainnet: {
    chainId: 480,
    name: 'World Chain Mainnet',
    rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
    blockExplorer: 'https://worldscan.org',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

// Contract function signatures for easy reference
export const CONTRACT_FUNCTIONS = {
  // Read functions
  challenges: 'challenges(uint256)',
  challengeCounter: 'challengeCounter()',
  participants: 'participants(uint256,address)',
  wldToken: 'wldToken()',
  backendSigner: 'backendSigner()',
  owner: 'owner()',
  
  // Write functions
  createChallenge: 'createChallenge(string,string,uint256,uint256,uint256)',
  joinChallenge: 'joinChallenge(uint256)',
  completeChallenge: 'completeChallenge(uint256,bytes)',
  withdrawPrize: 'withdrawPrize(uint256)',
} as const;

// Event signatures
export const CONTRACT_EVENTS = {
  ChallengeCreated: 'ChallengeCreated(uint256,string,string,uint256,uint256,uint256)',
  ParticipantJoined: 'ParticipantJoined(uint256,address,uint256)',
  ChallengeCompleted: 'ChallengeCompleted(uint256,address)',
  PrizeWithdrawn: 'PrizeWithdrawn(uint256,address,uint256)',
} as const;

// Type definitions
export interface Challenge {
  id: number;
  title: string;
  description: string;
  stakeAmount: bigint;
  startTime: number;
  endTime: number;
  totalStaked: bigint;
  participantCount: number;
  isActive: boolean;
  winners: string[];
}

export interface Participant {
  user: string;
  stakeAmount: bigint;
  hasCompleted: boolean;
  hasWithdrawn: boolean;
  joinedAt: number;
} 