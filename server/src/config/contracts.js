const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// World Chain Mainnet configuration
const worldchainMainnet = {
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
    default: {
      name: 'World Chain Explorer',
      url: 'https://worldchain-mainnet.explorer.alchemy.com',
    },
  },
};

// Contract addresses
const HEALTH_CHALLENGE_ADDRESS = '0xB36b82E2090D574Dfd5f3bCc835af09A3De8fb1F';
const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';

// Health Challenge Contract ABI
const HEALTH_CHALLENGE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_wldToken',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_permit2',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'challengeCounter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'challenges',
    outputs: [
      {
        internalType: 'uint256',
        name: 'entryFee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'totalPool',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'participantCount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'winnerCount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isActive',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'isCompleted',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'challengeId',
        type: 'uint256',
      },
      {
        internalType: 'address[]',
        name: 'winners',
        type: 'address[]',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'completeChallenge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'entryFee',
        type: 'uint256',
      },
    ],
    name: 'createChallenge',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'challengeId',
        type: 'uint256',
      },
    ],
    name: 'getChallengeDetails',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'challengeId',
        type: 'uint256',
      },
    ],
    name: 'joinChallenge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'challengeId',
        type: 'uint256',
      },
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'token',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            internalType: 'struct ISignatureTransfer.TokenPermissions',
            name: 'permitted',
            type: 'tuple',
          },
          {
            internalType: 'uint256',
            name: 'nonce',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct ISignatureTransfer.PermitTransferFrom',
        name: 'permit',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'requestedAmount',
            type: 'uint256',
          },
        ],
        internalType: 'struct ISignatureTransfer.SignatureTransferDetails',
        name: 'transferDetails',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'joinChallengeWithPermit2',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'participants',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'permit2',
    outputs: [
      {
        internalType: 'contract ISignatureTransfer',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'wldToken',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Create clients
const createClients = () => {
  const publicClient = createPublicClient({
    chain: worldchainMainnet,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const account = privateKeyToAccount(
    process.env.PRIVATE_KEY ||
      '0xddfc19cf4d3f82685d82fe4f3fd9d7c8998695bfc8bf3dc2550254196aeddddc'
  );

  const walletClient = createWalletClient({
    account,
    chain: worldchainMainnet,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  return { publicClient, walletClient, account };
};

module.exports = {
  worldchainMainnet,
  HEALTH_CHALLENGE_ADDRESS,
  WLD_TOKEN_ADDRESS,
  HEALTH_CHALLENGE_ABI,
  createClients,
};
