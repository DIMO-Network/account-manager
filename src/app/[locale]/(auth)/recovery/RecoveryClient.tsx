'use client';

import type { SupportedChains } from '@/services/recovery/turnkey-bridge';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RecoveryIcon } from '@/components/Icons';
import { TransactionBuilder } from '@/components/transaction-builder';
import { PageHeader } from '@/components/ui';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { createRecoveryService } from '@/services/recovery/recovery-service';
import { checkAccountDeployment } from '@/services/recovery/zerodev-service';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type RecoveryClientProps = {
  translations: {
    title: string;
    description: string;
    coming_soon: string;
  };
};

const isTestnet = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'testnet';
const NETWORKS = [
  {
    id: isTestnet ? 11155111 : 1, // Sepolia: 11155111, Mainnet: 1
    name: isTestnet ? 'Ethereum Sepolia (Testnet)' : 'Ethereum',
    symbol: 'ETH',
  },
  {
    id: isTestnet ? 80002 : 137, // Amoy: 80002, Polygon: 137
    name: isTestnet ? 'Polygon Amoy (Testnet)' : 'Polygon',
    symbol: 'MATIC',
  },
  {
    id: isTestnet ? 84532 : 8453, // Base Sepolia: 84532, Base: 8453
    name: isTestnet ? 'Base Sepolia (Testnet)' : 'Base',
    symbol: 'ETH',
  },
];

const SUPPORTED_CHAINS = {
  // Mainnet
  1: 'ETHEREUM',
  137: 'POLYGON',
  8453: 'BASE',
  // Testnets
  11155111: 'ETHEREUM', // Sepolia
  80002: 'POLYGON', // Amoy
  84532: 'BASE', // Base Sepolia
} as const;

export function RecoveryClient({ translations }: RecoveryClientProps) {
  const router = useRouter();
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<Record<string, { isDeployed: boolean }>>({});
  const [checkingDeployment, setCheckingDeployment] = useState(false);

  const [form, setForm] = useState({
    network: isTestnet ? '80002' : '137', // Default to Amoy (80002) in testnet, Polygon (137) in mainnet
  });

  const checkDeploymentStatus = async (walletAddress: string) => {
    if (!walletAddress) {
      return;
    }

    setCheckingDeployment(true);
    const status: Record<string, { isDeployed: boolean }> = {};

    try {
      // Only check networks that match the current environment (testnet vs mainnet)
      const networksToCheck = isTestnet
        ? Object.entries(SUPPORTED_CHAINS).filter(([chainId]) =>
            ['11155111', '80002', '84532'].includes(chainId),
          )
        : Object.entries(SUPPORTED_CHAINS).filter(([chainId]) =>
            ['1', '137', '8453'].includes(chainId),
          );

      for (const [chainId, chainName] of networksToCheck) {
        const result = await checkAccountDeployment(walletAddress, chainName as SupportedChains);
        status[chainId] = result;
      }

      setDeploymentStatus(status);
    } catch (error) {
      console.error('Error checking deployment status:', error);
    } finally {
      setCheckingDeployment(false);
    }
  };

  const getExplorerUrl = (chainId: number, address: string) => {
    const baseUrls: Record<number, string> = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80002: 'https://amoy.polygonscan.com',
      8453: 'https://basescan.org',
      84532: 'https://sepolia.basescan.org',
    };

    const baseUrl = baseUrls[chainId];
    return baseUrl ? `${baseUrl}/address/${address}` : '#';
  };

  useEffect(() => {
    console.warn('Recovery Authorization Debug:', {
      customerId,
      customerLoading,
      customerError,
      allowedUsers: process.env.NEXT_PUBLIC_ALLOWED_TOP_UP_USERS?.split(',').map(id => id.trim()) || [],
    });

    if (customerLoading) {
      console.warn('Still loading customer data, waiting...');
      return;
    }

    if (customerError || !customerId) {
      console.warn('Redirecting due to customer error or missing customer ID');
      router.push('/');
      return;
    }

    // Check if user is authorized to use recovery feature (same as Top Up)
    const allowedUsers = process.env.NEXT_PUBLIC_ALLOWED_TOP_UP_USERS?.split(',').map(id => id.trim()) || [];
    if (!allowedUsers.includes(customerId)) {
      console.warn('Redirecting due to unauthorized user:', customerId, 'not in', allowedUsers);
      router.push('/');
      return;
    }

    // Fetch Login With DIMO session data for smart account deployment
    const fetchSessionData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          console.warn('Session data:', data); // Debug: see what's in the session
          setSessionData(data);
          setWalletAddress(data.walletAddress || 'Wallet address not found');

          // Check smart account deployment status across all supported networks
          if (data.walletAddress) {
            await checkDeploymentStatus(data.walletAddress);
          }
        } else {
          setWalletAddress('Error loading session data');
        }
      } catch (error) {
        console.error('Failed to get session data:', error);
        setWalletAddress('Error loading session data');
      }
    };

    fetchSessionData();
  }, [customerId, customerLoading, customerError, router]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Deploy smart account to the selected blockchain network using Login With DIMO session data and Turnkey
  const handleDeployAccount = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!sessionData?.walletAddress || !sessionData?.dimoToken) {
        throw new Error('Missing required session data (walletAddress, dimoToken)');
      }

      const subOrganizationId = sessionData?.subOrganizationId;
      if (!subOrganizationId) {
        setError('⚠️ Missing subOrganizationId in session data.');
        return;
      }

      const networkId = Number.parseInt(form.network);
      const chainName = SUPPORTED_CHAINS[networkId as keyof typeof SUPPORTED_CHAINS];

      if (!chainName) {
        throw new Error('Unsupported network selected');
      }

      // Create recovery service using LIWD session
      const recoveryService = await createRecoveryService({
        dimoToken: sessionData.dimoToken,
        subOrganizationId,
        walletAddress: sessionData.walletAddress,
      });

      // Deploy account on target chain
      const result = await recoveryService.deployAccount(chainName as SupportedChains);

      if (result.success) {
        setSuccess(true);
        setError('');
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment error:', error);

      // Provide more helpful error messages
      let errorMessage = error instanceof Error ? error.message : 'Account deployment failed';

      if (errorMessage.includes('Passkey authentication failed')) {
        errorMessage = `⚠️ Passkey authentication failed. This is expected since we're using a placeholder organization ID. To complete the integration, you need to:

1. Get the real subOrganizationId from DIMO Global Accounts API
2. Register a passkey for that organization
3. Update the environment variables with real Turnkey credentials`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authorization
  if (customerLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader icon={<RecoveryIcon />} title={translations.title} className="mb-0" />
        <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <PageHeader icon={<RecoveryIcon />} title={translations.title} className="mb-0" />

      {/* Content */}
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        <div className="mb-6">
          <p className="text-text-secondary mb-4">
            {translations.description}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>How this works:</strong>
              <br />
              • Your DIMO smart account has the same address across all networks (Ethereum, Polygon, Base)
              <br />
              • It's currently only deployed on Polygon (via ZeroDev in the DIMO Mobile app)
              <br />
              • If someone sends tokens to your address on a network where your smart account isn't deployed, they're stuck
              <br />
              • First, deploy your smart account to the target network
              <br />
              • After deployment, you can use the transaction builder to recover and transfer your stuck tokens
              <br />
              <strong>Note:</strong>
              {' '}
              This tool does not bridge tokens between networks. It just gives you access to manage them on the target network
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Wallet Address Display */}
          <div>
            <label htmlFor="wallet-address" className="block text-sm font-medium mb-1">
              Your Wallet Address
            </label>
            <div id="wallet-address" className="flex flex-row rounded-md bg-surface-sunken px-4 py-2 w-full text-gray-400">
              {walletAddress || 'Loading...'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This address will be deployed on the selected network
            </p>
          </div>

          {/* Network Selection */}
          <div>
            <label htmlFor="network" className="block text-sm font-medium mb-1">
              Deploy Account On (Where are your tokens stuck?)
            </label>
            <select
              id="network"
              name="network"
              value={form.network}
              onChange={handleChange}
              className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full"
            >
              {NETWORKS.map((network) => {
                const isDeployed = deploymentStatus[network.id]?.isDeployed || false;
                return (
                  <option key={network.id} value={network.id}>
                    {network.name}
                    {' '}
                    (Chain ID:
                    {network.id}
                    )
                    {isDeployed ? ' - Smart account deployed' : ' - Available for deployment'}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the network where you accidentally sent tokens
              {isTestnet && ' (Currently testing on testnets)'}
            </p>

            {/* Deployment Status Indicator */}
            {checkingDeployment && (
              <div className="mt-2 text-xs text-gray-500">
                Checking deployment status across networks...
              </div>
            )}

            {!checkingDeployment && walletAddress && deploymentStatus[form.network]?.isDeployed && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Smart account already deployed on this network
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      <a
                        href={getExplorerUrl(Number(form.network), walletAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-green-800"
                      >
                        View on blockchain explorer →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ Smart account deployed successfully! You can now access your stuck tokens on this network.
              </p>
              {walletAddress && (
                <p className="text-green-700 text-xs mt-2">
                  <a
                    href={getExplorerUrl(Number(form.network), walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-green-800"
                  >
                    View deployed account on blockchain explorer →
                  </a>
                </p>
              )}
              <p className="text-green-700 text-xs mt-2">
                Next: Use the transaction builder to transfer your tokens to the correct network.
              </p>
            </div>
          )}

          {/* Deploy Account Button */}
          <div className="flex flex-col pt-4">
            {deploymentStatus[form.network]?.isDeployed
              ? (
                  <div className="text-center py-3 px-4 bg-gray-100 text-gray-600 rounded-full">
                    Smart account already deployed on this network
                  </div>
                )
              : (
                  <button
                    type="button"
                    onClick={handleDeployAccount}
                    disabled={loading || !walletAddress || checkingDeployment}
                    className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 ${
                      loading || !walletAddress || checkingDeployment
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Deploying Account...' : checkingDeployment ? 'Checking Status...' : 'Deploy Account on Selected Network'}
                  </button>
                )}
            {!walletAddress && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Loading wallet address...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Builder - Show when smart account is deployed */}
      {!checkingDeployment && walletAddress && deploymentStatus[form.network]?.isDeployed && (
        <div className="mt-8">
          <TransactionBuilder
            networkId={form.network}
            walletAddress={walletAddress}
            sessionData={sessionData}
            onTransactionExecutedAction={(txHash) => {
              console.warn('Transaction executed:', txHash);
              // TODO: Handle transaction execution success
            }}
          />
        </div>
      )}
    </div>
  );
}
