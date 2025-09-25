'use client';

import type { SupportedChains } from '@/services/recovery/turnkey-bridge';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RecoveryIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { createRecoveryService } from '@/services/recovery/recovery-service';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type RecoveryClientProps = {
  translations: {
    title: string;
    description: string;
    coming_soon: string;
  };
};

// Network configurations - show testnet names and chain IDs in development
const isDevelopment = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'development';
const NETWORKS = [
  {
    id: isDevelopment ? 11155111 : 1, // Sepolia: 11155111, Mainnet: 1
    name: isDevelopment ? 'Ethereum Sepolia (Testnet)' : 'Ethereum',
    symbol: 'ETH',
  },
  {
    id: isDevelopment ? 80002 : 137, // Amoy: 80002, Polygon: 137
    name: isDevelopment ? 'Polygon Amoy (Testnet)' : 'Polygon',
    symbol: 'MATIC',
  },
  {
    id: isDevelopment ? 84532 : 8453, // Base Sepolia: 84532, Base: 8453
    name: isDevelopment ? 'Base Sepolia (Testnet)' : 'Base',
    symbol: 'ETH',
  },
];

// Supported chains for account deployment (includes both mainnet and testnet chain IDs)
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
  const [transactionHash, _setTransactionHash] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [sessionData, setSessionData] = useState<any>(null);

  const [form, setForm] = useState({
    network: isDevelopment ? '80002' : '137', // Default to Amoy (80002) in dev, Polygon (137) in prod
  });

  // Check authorization and fetch session data
  useEffect(() => {
    console.warn('Recovery Authorization Debug:', {
      customerId,
      customerLoading,
      customerError,
      allowedUsers: process.env.NEXT_PUBLIC_ALLOWED_TOP_UP_USERS?.split(',').map(id => id.trim()) || [],
    });

    // Don't redirect while loading
    if (customerLoading) {
      console.warn('Still loading customer data, waiting...');
      return;
    }

    if (customerError || !customerId) {
      // If there's an error or no customer ID, redirect to dashboard
      console.warn('Redirecting due to customer error or missing customer ID');
      router.push('/');
      return;
    }

    // Check if user is authorized to use recovery feature (same as Top Up)
    const allowedUsers = process.env.NEXT_PUBLIC_ALLOWED_TOP_UP_USERS?.split(',').map(id => id.trim()) || [];
    if (!allowedUsers.includes(customerId)) {
      // User is not authorized, redirect to dashboard
      console.warn('Redirecting due to unauthorized user:', customerId, 'not in', allowedUsers);
      router.push('/');
      return;
    }

    // Fetch session data for recovery functionality
    const fetchSessionData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          console.warn('Session data:', data); // Debug: see what's in the session
          setSessionData(data);
          setWalletAddress(data.walletAddress || 'Wallet address not found');
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

  const handleDeployAccount = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!sessionData?.walletAddress || !sessionData?.dimoToken) {
        throw new Error('Missing required session data (walletAddress, dimoToken)');
      }

      // Handle missing subOrganizationId in existing sessions
      // Use userId as fallback for existing sessions
      const subOrganizationId = sessionData?.subOrganizationId || sessionData?.id;
      if (!subOrganizationId) {
        setError('⚠️ Missing user ID in session data.');
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
        _setTransactionHash(result.transactionHash || '');
        setError('');
        console.warn('Account deployed successfully:', result.transactionHash);
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
              • Your DIMO smart account has the same address across all networks
              <br />
              • It's currently only deployed on Polygon (via ZeroDev)
              <br />
              • When you send tokens to the "wrong" network, they're stuck because the account isn't deployed there
              <br />
              • This tool uses your existing Login With DIMO session + Turnkey + ZeroDev to deploy your account on the "wrong" network
              <br />
              • After deployment, you can access and transfer your stuck tokens
              {isDevelopment && (
                <>
                  <br />
                  •
                  {' '}
                  <strong>Testing Mode:</strong>
                  {' '}
                  Currently testing on testnets (Amoy, Sepolia, Base Sepolia)
                </>
              )}
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
              {NETWORKS.map(network => (
                <option key={network.id} value={network.id}>
                  {network.name}
                  {' '}
                  (Chain ID:
                  {network.id}
                  )
                  {(network.id === 137 || network.id === 80002) ? ' - Already deployed' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the network where you accidentally sent tokens
              {isDevelopment && ' (Currently testing on testnets)'}
            </p>
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
              {transactionHash && (
                <p className="text-green-700 text-xs mt-2">
                  Transaction Hash:
                  {' '}
                  <code className="bg-green-100 px-1 rounded">{transactionHash}</code>
                </p>
              )}
              <p className="text-green-700 text-xs mt-2">
                Next: Use the transaction builder to transfer your tokens to the correct network.
              </p>
            </div>
          )}

          {/* Deploy Account Button */}
          <div className="flex flex-col pt-4">
            <button
              type="button"
              onClick={handleDeployAccount}
              disabled={loading || !walletAddress}
              className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 ${
                loading || !walletAddress
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Deploying Account...' : 'Deploy Account on Selected Network'}
            </button>
            {!walletAddress && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Loading wallet address...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
