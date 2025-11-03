import type { KernelAccountClient } from '@zerodev/sdk';
import type { Client, RpcSchema, Transport } from 'viem';
import type {
  GetPaymasterDataParameters,
  SmartAccount,
} from 'viem/account-abstraction';
import type { Chain } from 'viem/chains';
import { createAccount } from '@turnkey/viem';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import {
  createFallbackKernelAccountClient,
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  getUserOperationGasPrice,

} from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia, mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains';
import { getTurnkeyConfig, SupportedChains } from './turnkey-bridge';

export type TurnkeyAccountClient = Parameters<typeof createAccount>[0]['client'];

const getRpcUrl = (targetChain: SupportedChains): string => {
  const config = getTurnkeyConfig();
  switch (targetChain) {
    case SupportedChains.ETHEREUM:
      return config.ethereumRpcUrl;
    case SupportedChains.BASE:
      return config.baseRpcUrl;
    case SupportedChains.POLYGON:
    default:
      return config.polygonRpcUrl;
  }
};

const getChain = (targetChain: SupportedChains): Chain => {
  const isTestnet = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'testnet';

  switch (targetChain) {
    case SupportedChains.ETHEREUM:
      return isTestnet ? sepolia : mainnet;
    case SupportedChains.BASE:
      return isTestnet ? baseSepolia : base;
    case SupportedChains.POLYGON:
    default:
      return isTestnet ? polygonAmoy : polygon;
  }
};

// Create a Viem public client for reading blockchain data
export const getPublicClient = (targetChain: SupportedChains) => {
  const chain = getChain(targetChain);
  const rpcUrl = getRpcUrl(targetChain);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
};

// Request gas sponsorship for a user operation from ZeroDev paymaster
const sponsorUserOperation = async ({
  userOperation,
  provider,
  targetChain,
}: {
  userOperation: GetPaymasterDataParameters;
  provider: string;
  targetChain: SupportedChains;
}) => {
  const config = getTurnkeyConfig();
  const chain = getChain(targetChain);
  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain,
    transport: http(`${config.bundleRpc}/${chain.id}?provider=${provider}`),
  });
  return zerodevPaymaster.sponsorUserOperation({
    userOperation,
  });
};

// Create a ZeroDev Kernel smart account with ECDSA validation so that it be deployed across multiple EVM-compatible chains
export const getKernelAccount = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyAccountClient;
  targetChain: SupportedChains;
}) => {
  const entryPoint = getEntryPoint('0.7');
  const publicClient = getPublicClient(targetChain);

  // Create Turnkey account for signing
  const localAccount = await createAccount({
    client,
    organizationId: subOrganizationId,
    signWith: walletAddress,
    ethereumAddress: walletAddress,
  });

  // Create ECDSA validator for the smart account
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: localAccount,
    entryPoint,
    kernelVersion: KERNEL_V3_1,
  });

  // Create the Kernel smart account
  const zeroDevKernelAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion: KERNEL_V3_1,
  });

  return zeroDevKernelAccount;
};

// If one provider fails, try the next one
const buildFallbackKernelClients = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyAccountClient;
  targetChain: SupportedChains;
}) => {
  const fallbackProviders: string[] = ['ALCHEMY', 'GELATO', 'PIMLICO'];
  const fallbackKernelClients: KernelAccountClient<
    Transport,
    Chain,
    SmartAccount,
    Client,
    RpcSchema
  >[] = [];

  const chain = getChain(targetChain);
  const kernelAccount = await getKernelAccount({
    subOrganizationId,
    walletAddress,
    client,
    targetChain,
  });

  const config = getTurnkeyConfig();

  // Create clients for each provider
  for (const provider of fallbackProviders) {
    const kernelClient = createKernelAccountClient({
      account: kernelAccount,
      chain,
      bundlerTransport: http(`${config.bundleRpc}/${chain.id}?provider=${provider}`),
      client: kernelAccount.client,
      paymaster: {
        getPaymasterData: (userOperation) => {
          return sponsorUserOperation({
            userOperation,
            provider,
            targetChain,
          });
        },
      },
      userOperation: {
        estimateFeesPerGas: async ({ bundlerClient }) => {
          return getUserOperationGasPrice(bundlerClient);
        },
      },
    });

    fallbackKernelClients.push(kernelClient);
  }

  return createFallbackKernelAccountClient(fallbackKernelClients);
};

// Get a Kernel client with fallback providers
export const getKernelClient = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyAccountClient;
  targetChain: SupportedChains;
}) => {
  const kernelClient = await buildFallbackKernelClients({
    subOrganizationId,
    walletAddress,
    client,
    targetChain,
  });
  return kernelClient;
};

// Check if a smart account is already deployed on a specific chain
export const checkAccountDeployment = async (walletAddress: string, targetChain: SupportedChains): Promise<{
  isDeployed: boolean;
}> => {
  try {
    const publicClient = getPublicClient(targetChain);
    const code = await publicClient.getCode({ address: walletAddress as `0x${string}` });

    // Check if there's actual contract code (not just '0x' for empty accounts)
    const isDeployed = code !== undefined && code !== '0x' && code.length > 2;
    console.warn(`Chain ${targetChain}: Code at ${walletAddress} = ${code} (isDeployed: ${isDeployed})`);

    return { isDeployed };
  } catch (error) {
    console.warn(`Chain ${targetChain}: Error checking code -`, error);
    return { isDeployed: false };
  }
};
