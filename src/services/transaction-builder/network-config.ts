import type { NetworkConfig } from './types';

// Network configurations for transaction builder
export const TRANSACTION_BUILDER_NETWORKS: Record<string, NetworkConfig> = {
  // Mainnet Networks
  1: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism.llamarpc.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  // Testnet Networks
  11155111: {
    chainId: 11155111,
    name: 'Ethereum Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || 'https://sepolia.llamarpc.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  80002: {
    chainId: 80002,
    name: 'Polygon Amoy',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://amoy.llamarpc.com',
    explorerUrl: 'https://amoy.polygonscan.com',
    isTestnet: true,
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  84532: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.llamarpc.com',
    explorerUrl: 'https://sepolia.basescan.org',
    isTestnet: true,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export const getNetworkConfig = (chainId: string | number): NetworkConfig | null => {
  return TRANSACTION_BUILDER_NETWORKS[chainId.toString()] || null;
};

export const getSupportedNetworks = (isTestnet: boolean = false): NetworkConfig[] => {
  return Object.values(TRANSACTION_BUILDER_NETWORKS).filter(
    network => network.isTestnet === isTestnet,
  );
};

export const getExplorerUrl = (chainId: number, address: string, type: 'address' | 'tx' = 'address'): string => {
  const network = getNetworkConfig(chainId);
  if (!network) {
    return '#';
  }

  const baseUrl = network.explorerUrl;
  return `${baseUrl}/${type}/${address}`;
};
