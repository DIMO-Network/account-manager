import { ApiKeyStamper } from '@turnkey/api-key-stamper';
import { decryptCredentialBundle, getPublicKey } from '@turnkey/crypto';
import { uint8ArrayFromHexString, uint8ArrayToHexString } from '@turnkey/encoding';
import { TurnkeyClient } from '@turnkey/http';
import { Env } from '@/libs/Env';

export enum SupportedChains {
  POLYGON = 'POLYGON',
  ETHEREUM = 'ETHEREUM',
  BASE = 'BASE',
}

export type TurnkeyConfig = {
  apiBaseUrl: string;
  apiPrivateKey: string;
  apiPublicKey: string;
  defaultOrganizationId: string;
  polygonRpcUrl: string;
  ethereumRpcUrl: string;
  baseRpcUrl: string;
  bundleRpc: string;
  paymasterRpc: string;
};

export const getTurnkeyConfig = (): TurnkeyConfig => {
  return {
    apiBaseUrl: Env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || 'https://api.turnkey.com',
    apiPrivateKey: Env.TURNKEY_API_PRIVATE_KEY || '',
    apiPublicKey: Env.TURNKEY_API_PUBLIC_KEY || '',
    defaultOrganizationId: Env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID || '',
    polygonRpcUrl: 'https://polygon-rpc.com',
    ethereumRpcUrl: 'https://eth.llamarpc.com',
    baseRpcUrl: 'https://mainnet.base.org',
    bundleRpc: Env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL || 'https://bundler.zerodev.app',
    paymasterRpc: Env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC_URL || 'https://paymaster.zerodev.app',
  };
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
