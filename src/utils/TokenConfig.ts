export const TOKEN_CONFIG = {
  OMID: {
    symbol: 'OMID',
    contract: process.env.OMID_TOKEN_CONTRACT || '0x21cfe003997fb7c2b3cfe5cf71e7833b7b2ece10',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.drpc.org',
  },
  DIMO: {
    symbol: 'DIMO',
    contract: process.env.DIMO_TOKEN_CONTRACT || '0xE261D618a959aFfFd53168Cd07D12E37B26761db',
    rpcUrl: process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com',
  },
} as const;

// Shared configuration
export const SHARED_CONFIG = {
  recipient: process.env.TOKEN_RECIPIENT_ADDRESS || '0xCec224A21bdF3Bd2d5E95aC38A92523146b814Bd',
  transferFee: Number(process.env.TRANSFER_FEE) || 0.5,
  minAmount: Number(process.env.MIN_TOKEN_AMOUNT) || 0.5,
} as const;

export const getCurrentTokenConfig = () =>
  process.env.NEXT_PUBLIC_USE_OMID_TOKEN ? TOKEN_CONFIG.OMID : TOKEN_CONFIG.DIMO;
