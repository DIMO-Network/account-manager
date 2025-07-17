import {
  CHAIN_ABI_MAPPING,
  ContractType,
  ENV_MAPPING,
  ENVIRONMENT,
  newKernelConfig,
  Permission,
} from '@dimo-network/transactions';

// Environment configuration
const getEnvironment = () => {
  if (process.env.NEXT_PUBLIC_DIMO_ENV === 'development') {
    return 'development';
  }
  return 'production';
};

const BACKEND_ENV = getEnvironment();

// RPC URLs - you'll need to set these in your environment variables
const RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com';
const BUNDLER_RPC = process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_URL || '';
const PAYMASTER_RPC = process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_URL || '';
const AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_DIMO_AUTH_CLIENT_ID || '';
const AUTH_ISSUER = process.env.NEXT_PUBLIC_DIMO_AUTH_REDIRECT_URI || '';

export const kernelSignerConfig = newKernelConfig({
  rpcUrl: RPC_URL,
  bundlerUrl: BUNDLER_RPC,
  paymasterUrl: PAYMASTER_RPC,
  environment: BACKEND_ENV,
  useWalletSession: true,
  clientId: AUTH_CLIENT_ID,
  domain: `${AUTH_ISSUER}/void/callback`,
  redirectUri: `${AUTH_ISSUER}/void/callback`,
  defaultPermissions: [
    Permission.GetApproximateLocation,
    Permission.GetRawData,
    Permission.GetLiveData,
    Permission.GetVINCredential,
    Permission.GetLocationHistory,
    Permission.GetCurrentLocation,
    Permission.ExecuteCommands,
    Permission.GetNonLocationHistory,
  ],
});

export const contractMapping = CHAIN_ABI_MAPPING[ENV_MAPPING.get(BACKEND_ENV) ?? ENVIRONMENT.PROD].contracts;

// Helper to get DIMO token contract address
export const getDimoTokenContract = () => {
  return contractMapping[ContractType.DIMO_TOKEN];
};
