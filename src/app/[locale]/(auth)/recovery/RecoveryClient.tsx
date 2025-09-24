'use client';

import { useEffect, useState } from 'react';
import { RecoveryIcon } from '@/components/Icons';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type RecoveryClientProps = {
  translations: {
    title: string;
    description: string;
    coming_soon: string;
  };
};

// Network configurations (only supported chains)
const NETWORKS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
];

// Supported chains for account deployment
const SUPPORTED_CHAINS = {
  1: 'ETHEREUM',
  137: 'POLYGON',
  8453: 'BASE',
} as const;

export function RecoveryClient({ translations }: RecoveryClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionHash, _setTransactionHash] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [sessionData, setSessionData] = useState<any>(null);

  const [form, setForm] = useState({
    network: '1', // Default to Ethereum
  });

  // Get session data from API (client-side safe)
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
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
  }, []);

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

      const networkId = Number.parseInt(form.network);
      const chainName = SUPPORTED_CHAINS[networkId as keyof typeof SUPPORTED_CHAINS];

      if (!chainName) {
        throw new Error('Unsupported network selected');
      }

      // For now, show a placeholder message since we need to implement the eKey extraction
      setError('⚠️ Implementation in progress: Need to extract eKey from LIWD session to complete Turnkey integration');

      // TODO: Once eKey extraction is implemented, uncomment this:
      /*
      const recoveryService = await createRecoveryService({
        dimoToken: sessionData.dimoToken,
        subOrganizationId: sessionData.subOrganizationId, // This might need to be added to session
        walletAddress: sessionData.walletAddress,
      });

      const result = await recoveryService.deployAccount(chainName);

      if (result.success) {
        setSuccess(true);
        setTransactionHash(result.transactionHash || '');
        setError('');
        console.log('Account deployed successfully:', result.transactionHash);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
      */
    } catch (error) {
      console.error('Deployment error:', error);
      setError(error instanceof Error ? error.message : 'Account deployment failed');
    } finally {
      setLoading(false);
    }
  };

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
                  {network.id === 137 ? ' - Already deployed' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the network where you accidentally sent tokens
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
