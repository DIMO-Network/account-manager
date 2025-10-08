import { createPublicClient, formatEther, http } from 'viem';
import { arbitrum, base, baseSepolia, mainnet, optimism, polygon, polygonAmoy, sepolia } from 'viem/chains';
import { getNetworkConfig } from './network-config';

// Gas estimation utilities for transaction builder
export type GasEstimate = {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string;
  estimatedCostUSD?: string;
};

export type GasConfig = {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasMultiplier?: number;
};

// Chain configurations for viem
const CHAIN_CONFIGS = {
  1: mainnet,
  137: polygon,
  8453: base,
  10: optimism,
  42161: arbitrum,
  11155111: sepolia,
  80002: polygonAmoy,
  84532: baseSepolia,
};

export const getChainConfig = (chainId: number) => {
  return CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS];
};

export const getFallbackGasLimit = (chainId: number): bigint => {
  // Common gas limits for different transaction types
  const gasLimits = {
    1: BigInt(21000), // Ethereum - basic transfer
    137: BigInt(21000), // Polygon - basic transfer
    8453: BigInt(21000), // Base - basic transfer
    10: BigInt(21000), // Optimism - basic transfer
    42161: BigInt(21000), // Arbitrum - basic transfer
    11155111: BigInt(21000), // Ethereum Sepolia
    80002: BigInt(21000), // Polygon Amoy
    84532: BigInt(21000), // Base Sepolia
  };

  return gasLimits[chainId as keyof typeof gasLimits] || BigInt(100000);
};

export const getFallbackGasPrice = (chainId: number): bigint => {
  // Fallback gas prices (in wei)
  const gasPrices = {
    1: BigInt(20000000000), // 20 gwei
    137: BigInt(30000000000), // 30 gwei
    8453: BigInt(1000000000), // 1 gwei
    10: BigInt(1000000000), // 1 gwei
    42161: BigInt(1000000000), // 1 gwei
    11155111: BigInt(1000000000), // 1 gwei
    80002: BigInt(1000000000), // 1 gwei
    84532: BigInt(1000000000), // 1 gwei
  };

  return gasPrices[chainId as keyof typeof gasPrices] || BigInt(1000000000);
};

export const createNetworkClient = (chainId: number) => {
  const networkConfig = getNetworkConfig(chainId);
  const chainConfig = getChainConfig(chainId);

  if (!networkConfig || !chainConfig) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return createPublicClient({
    chain: chainConfig,
    transport: http(networkConfig.rpcUrl),
  });
};

export const estimateGas = async (
  chainId: number,
  transaction: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    from?: `0x${string}`;
  },
  gasConfig?: GasConfig,
): Promise<GasEstimate> => {
  try {
    const client = createNetworkClient(chainId);
    const networkConfig = getNetworkConfig(chainId);

    if (!networkConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Estimate gas limit
    const gasLimit = await client.estimateGas({
      ...transaction,
      account: transaction.from as `0x${string}`,
    });

    // Apply gas multiplier if provided
    const multiplier = gasConfig?.gasMultiplier || 1.2;
    const adjustedGasLimit = BigInt(Math.ceil(Number(gasLimit) * multiplier));

    // Get gas price
    const gasPrice = await client.getGasPrice();

    // Calculate estimated cost
    const estimatedCost = adjustedGasLimit * gasPrice;
    const estimatedCostFormatted = formatEther(estimatedCost);

    return {
      gasLimit: gasConfig?.gasLimit || adjustedGasLimit,
      gasPrice: gasConfig?.gasPrice || gasPrice,
      estimatedCost: `${estimatedCostFormatted} ${networkConfig.nativeCurrency.symbol}`,
    };
  } catch (error) {
    console.warn('Gas estimation failed:', error);

    // Fallback gas estimates based on chain
    const fallbackGasLimit = getFallbackGasLimit(chainId);
    const fallbackGasPrice = getFallbackGasPrice(chainId);

    return {
      gasLimit: fallbackGasLimit,
      gasPrice: fallbackGasPrice,
      estimatedCost: 'Unknown (using fallback)',
    };
  }
};

export const formatGasCost = (gasLimit: bigint, gasPrice: bigint, chainId: number): string => {
  const networkConfig = getNetworkConfig(chainId);
  if (!networkConfig) {
    return 'Unknown';
  }

  const totalCost = gasLimit * gasPrice;
  const formattedCost = formatEther(totalCost);

  return `${formattedCost} ${networkConfig.nativeCurrency.symbol}`;
};

export const getGasPriceForChain = async (chainId: number): Promise<bigint> => {
  try {
    const client = createNetworkClient(chainId);
    return await client.getGasPrice();
  } catch (error) {
    console.warn(`Failed to get gas price for chain ${chainId}:`, error);
    return getFallbackGasPrice(chainId);
  }
};

export const estimateTransactionCost = async (
  chainId: number,
  transaction: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    from?: `0x${string}`;
  },
): Promise<string> => {
  const gasEstimate = await estimateGas(chainId, transaction);
  return gasEstimate.estimatedCost;
};
