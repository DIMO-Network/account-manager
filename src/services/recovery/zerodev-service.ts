import type { TurnkeyClient } from '@turnkey/http';
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
  const isProduction = process.env.NODE_ENV === 'production';
  switch (targetChain) {
    case SupportedChains.ETHEREUM:
      return isProduction ? mainnet : sepolia;
    case SupportedChains.BASE:
      return isProduction ? base : baseSepolia;
    case SupportedChains.POLYGON:
    default:
      return isProduction ? polygon : polygonAmoy;
  }
};

export const getPublicClient = (targetChain: SupportedChains) => {
  const chain = getChain(targetChain);
  const rpcUrl = getRpcUrl(targetChain);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
};

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

export const getKernelAccount = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyClient;
  targetChain: SupportedChains;
}) => {
  const entryPoint = getEntryPoint('0.7');
  const publicClient = getPublicClient(targetChain);

  const localAccount = await createAccount({
    client,
    organizationId: subOrganizationId,
    signWith: walletAddress,
    ethereumAddress: walletAddress,
  });

  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: localAccount,
    entryPoint,
    kernelVersion: KERNEL_V3_1,
  });

  const zeroDevKernelAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion: KERNEL_V3_1,
  });

  return zeroDevKernelAccount;
};

const buildFallbackKernelClients = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyClient;
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

export const getKernelClient = async ({
  subOrganizationId,
  walletAddress,
  client,
  targetChain,
}: {
  subOrganizationId: string;
  walletAddress: `0x${string}`;
  client: TurnkeyClient;
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
