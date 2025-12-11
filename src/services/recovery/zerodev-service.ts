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
  const isTestnet = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'testnet';
  let rpcUrl: string;

  switch (targetChain) {
    case SupportedChains.ETHEREUM:
      rpcUrl = config.ethereumRpcUrl;
      break;
    case SupportedChains.BASE:
      rpcUrl = config.baseRpcUrl;
      break;
    case SupportedChains.POLYGON:
    default:
      rpcUrl = config.polygonRpcUrl;
      break;
  }

  if (!rpcUrl) {
    const networkType = isTestnet ? 'testnet' : 'mainnet';
    throw new Error(`Missing RPC URL for ${targetChain} ${networkType}. Please set the appropriate NEXT_PUBLIC_${targetChain}_RPC_URL environment variable.`);
  }

  return rpcUrl;
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

// Custom fetch that routes through Next.js API to avoid CORS issues
const createRpcFetch = (_rpcUrl: string) => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // For client-side, proxy through Next.js API route ONLY for rpc.dimo.org
    if (typeof window !== 'undefined') {
      // Normalize the input URL
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input instanceof Request
            ? input.url
            : String(input);

      // Proxy both rpc.dimo.org (CORS) and rpc.zerodev.app (domain allowlist) requests
      const needsProxy = url.includes('rpc.dimo.org') || url.includes('rpc.zerodev.app');

      if (needsProxy) {
        const requestBody = init?.body || '';
        const bodyString = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);

        try {
          const proxyResponse = await fetch('/api/rpc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url, // Use the actual request URL, not the base rpcUrl
              requestBody: bodyString,
            }),
          });

          if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json().catch(() => ({}));
            throw new Error(`RPC proxy failed: ${proxyResponse.statusText} - ${errorData.error || ''}`);
          }

          const data = await proxyResponse.json();

          // Return a Response-like object that viem expects
          return new Response(JSON.stringify(data), {
            status: 200,
            statusText: 'OK',
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
          });
        } catch (error) {
          console.error('RPC proxy error:', error);
          throw error;
        }
      }
    }

    // Server-side or non-proxied request: use direct fetch
    return fetch(input, init);
  };
};

// Create a Viem public client for reading blockchain data
export const getPublicClient = (targetChain: SupportedChains) => {
  const chain = getChain(targetChain);
  const rpcUrl = getRpcUrl(targetChain);
  const customFetch = createRpcFetch(rpcUrl);

  return createPublicClient({
    chain,
    transport: http(rpcUrl, {
      fetchFn: customFetch,
    }),
  });
};

// Request gas sponsorship for a user operation from ZeroDev paymaster
const sponsorUserOperation = async ({
  userOperation,
  provider: _provider,
  targetChain,
}: {
  userOperation: GetPaymasterDataParameters;
  provider: string;
  targetChain: SupportedChains;
}) => {
  const config = getTurnkeyConfig();
  const chain = getChain(targetChain);

  // For v3, ZeroDev uses the same endpoint for bundler and paymaster
  // Use the bundler URL with chain ID appended
  const bundleRpc = config.bundleRpc;
  if (!bundleRpc) {
    throw new Error('Bundler RPC URL is not configured. Please set NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL');
  }

  // Paymaster uses the same endpoint as bundler: /api/v3/{projectId}/chain/{chainId}
  const paymasterUrl = `${bundleRpc}/${chain.id}`;
  console.warn('Paymaster URL:', paymasterUrl);
  const customFetch = createRpcFetch(paymasterUrl);

  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain,
    transport: http(paymasterUrl, {
      fetchFn: customFetch,
    }),
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
    client: client as any, // TurnkeyClient from @turnkey/http works but types don't match exactly
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
    const bundlerUrl = `${config.bundleRpc}/${chain.id}?provider=${provider}`;
    const bundlerFetch = createRpcFetch(bundlerUrl);

    const kernelClient = createKernelAccountClient({
      account: kernelAccount,
      chain,
      bundlerTransport: http(bundlerUrl, {
        fetchFn: bundlerFetch,
      }),
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
    const chain = getChain(targetChain);

    // Verify we're querying the correct chain by checking chain ID
    const chainId = await publicClient.getChainId();
    if (chainId !== chain.id) {
      const isTestnet = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'testnet';
      const networkType = isTestnet ? 'testnet' : 'mainnet';
      const expectedNetwork = isTestnet
        ? (targetChain === 'ETHEREUM' ? 'Sepolia' : targetChain === 'BASE' ? 'Base Sepolia' : 'Amoy')
        : (targetChain === 'ETHEREUM' ? 'Ethereum Mainnet' : targetChain === 'BASE' ? 'Base Mainnet' : 'Polygon Mainnet');
      const actualNetwork = chainId === 1
        ? 'Ethereum Mainnet'
        : chainId === 11155111
          ? 'Sepolia'
          : chainId === 137
            ? 'Polygon Mainnet'
            : chainId === 80002
              ? 'Amoy'
              : chainId === 8453
                ? 'Base Mainnet'
                : chainId === 84532
                  ? 'Base Sepolia'
                  : `Chain ID ${chainId}`;

      console.error(
        `Chain ID mismatch for ${targetChain}: Expected ${chain.id} (${expectedNetwork}), but RPC returned ${chainId} (${actualNetwork}).\n`
        + `Your NEXT_PUBLIC_${targetChain}_RPC_URL is pointing to ${actualNetwork}, but NEXT_PUBLIC_RECOVERY_FLOW is set to '${networkType}'.\n`
        + `Please update your .env.local to use ${networkType} RPC URLs.`,
      );
      return { isDeployed: false };
    }

    const code = await publicClient.getCode({ address: walletAddress as `0x${string}` });

    // Check if there's actual contract code (not just '0x' for empty accounts)
    const isDeployed = code !== undefined && code !== '0x' && code.length > 2;
    console.warn(`Chain ${targetChain} (ID: ${chainId}): Code at ${walletAddress} = ${code?.substring(0, 20)}... (isDeployed: ${isDeployed})`);

    return { isDeployed };
  } catch (error) {
    console.warn(`Chain ${targetChain}: Error checking code -`, error);
    return { isDeployed: false };
  }
};
