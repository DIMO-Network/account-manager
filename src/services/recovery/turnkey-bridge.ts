import { ApiKeyStamper } from '@turnkey/api-key-stamper';
import { decryptCredentialBundle, getPublicKey } from '@turnkey/crypto';
import { uint8ArrayFromHexString, uint8ArrayToHexString } from '@turnkey/encoding';
import { TurnkeyClient } from '@turnkey/http';
import { Turnkey } from '@turnkey/sdk-browser';
import { Env } from '@/libs/Env';

export enum SupportedChains {
  POLYGON = 'POLYGON',
  ETHEREUM = 'ETHEREUM',
  BASE = 'BASE',
}

export type TurnkeyConfig = {
  apiBaseUrl: string;
  defaultOrganizationId: string;
  rpId: string;
  polygonRpcUrl: string;
  ethereumRpcUrl: string;
  baseRpcUrl: string;
  bundleRpc: string;
  paymasterRpc: string;
};

export const getTurnkeyConfig = (): TurnkeyConfig => {
  return {
    apiBaseUrl: Env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || 'https://api.turnkey.com',
    defaultOrganizationId: Env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID || '',
    rpId: Env.NEXT_PUBLIC_TURNKEY_RP_ID || 'localhost',
    polygonRpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || '',
    ethereumRpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || '',
    baseRpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || '',
    bundleRpc: Env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL || '',
    paymasterRpc: Env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC_URL || '',
  };
};

export const createTurnkeyClient = () => {
  const config = getTurnkeyConfig();
  return new Turnkey({
    apiBaseUrl: config.apiBaseUrl,
    defaultOrganizationId: config.defaultOrganizationId,
  });
};

export const getTurnkeyClient = ({
  authKey,
  eKey,
}: {
  authKey: string;
  eKey: string;
}): TurnkeyClient => {
  const privateKey = decryptCredentialBundle(authKey, eKey);
  const publicKey = uint8ArrayToHexString(
    getPublicKey(uint8ArrayFromHexString(privateKey), true),
  );

  const config = getTurnkeyConfig();

  return new TurnkeyClient(
    {
      baseUrl: config.apiBaseUrl,
    },
    new ApiKeyStamper({
      apiPublicKey: publicKey,
      apiPrivateKey: privateKey,
    }),
  );
};

export const getTurnkeyWalletAddress = async ({
  subOrganizationId,
  client,
}: {
  subOrganizationId: string;
  client: TurnkeyClient;
}): Promise<`0x${string}`> => {
  const { wallets } = await client.getWallets({
    organizationId: subOrganizationId,
  });

  if (!wallets || wallets.length === 0) {
    throw new Error('No wallets found for organization');
  }

  const firstWallet = wallets[0];
  if (!firstWallet) {
    throw new Error('First wallet is undefined');
  }

  const { account } = await client.getWalletAccount({
    organizationId: subOrganizationId,
    walletId: firstWallet.walletId,
  });

  return account.address as `0x${string}`;
};
