'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CreditCardIcon } from '@/components/Icons';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type CreditBalanceCardProps = {
  customerId: string;
  refreshTrigger?: number; // Increment this to trigger a refresh
};

type CreditBalance = {
  available: number;
  currency: string;
};

export const CreditBalanceCard = ({ customerId, refreshTrigger }: CreditBalanceCardProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);

  // Memoized fetchCreditBalance function
  const fetchCreditBalance = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/credit-balance?customer_id=${customerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch credit balance');
      }

      const data = await response.json();
      setCreditBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credit balance');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Check for transaction hash in URL parameters
  useEffect(() => {
    const txHash = searchParams.get('transactionHash');
    if (txHash) {
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHash');
      window.history.replaceState({}, '', url.toString());

      // Use setTimeout to defer state updates
      const timeoutId = setTimeout(() => {
        setPendingTxHash(txHash);
        setTransactionStatus('pending');
      }, 0);

      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
      };
    }
    // No cleanup needed when there's no transaction hash
    return undefined;
  }, [searchParams]);

  // Memoized callback functions to prevent infinite re-renders
  const handleTransactionConfirmed = useCallback(async (usdValue?: number) => {
    if (!pendingTxHash || isProcessingTransaction) {
      return;
    }

    setTransactionStatus('confirmed');
    setIsProcessingTransaction(true);

    // If we have a USD value, add it to the customer's credit balance
    if (usdValue && usdValue > 0) {
      try {
        const response = await fetch('/api/credit-balance/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(usdValue * 100), // Convert to cents
            currency: 'usd',
            description: 'DIMO token conversion credit',
            metadata: {
              transactionHash: pendingTxHash,
              source: 'dimo_conversion',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add credit balance');
        }

        // Refresh the credit balance display
        await fetchCreditBalance();

        // Clear transaction status after a delay
        setTimeout(() => {
          setPendingTxHash(null);
          setTransactionStatus('idle');
          setIsProcessingTransaction(false);
        }, 3000);
      } catch (error) {
        console.error('Error adding credit balance:', error);
        setTransactionStatus('failed');
        setIsProcessingTransaction(false);
      }
    } else {
      // No USD value, just clear the status
      setTimeout(() => {
        setPendingTxHash(null);
        setTransactionStatus('idle');
        setIsProcessingTransaction(false);
      }, 3000);
    }
  }, [pendingTxHash, fetchCreditBalance, isProcessingTransaction]);

  const handleTransactionFailed = useCallback(() => {
    setTransactionStatus('failed');
    setIsProcessingTransaction(false);
    setTimeout(() => {
      setPendingTxHash(null);
      setTransactionStatus('idle');
    }, 3000);
  }, []);

  // Transaction polling hook
  const { status, isLoading, error: pollingError, confirmations } = useTransactionPolling({
    txHash: pendingTxHash || undefined,
    enabled: !!pendingTxHash,
    onConfirmed: handleTransactionConfirmed,
    onFailed: handleTransactionFailed,
  });

  useEffect(() => {
    fetchCreditBalance();
  }, [fetchCreditBalance, refreshTrigger]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  if (loading && transactionStatus === 'idle') {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4 relative`}>
        <div className="flex flex-col">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-800 rounded w-32"></div>
            <div className="h-8 bg-gray-800 rounded w-24"></div>
            <div className="h-3 bg-gray-800 rounded w-64"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-8 w-20 bg-gray-800 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCardIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-red-500 text-sm">Error loading credit balance</span>
        </div>
        <p className="text-xs text-text-secondary">{error}</p>
      </div>
    );
  }

  const displayBalance = creditBalance?.available || 0;
  const displayCurrency = creditBalance?.currency || 'usd';

  const getTransactionStatusMessage = () => {
    switch (transactionStatus) {
      case 'pending':
        return 'Processing transaction...';
      case 'confirmed':
        return 'Transaction confirmed! Credit added.';
      case 'failed':
        return 'Transaction failed';
      default:
        return null;
    }
  };

  const getTransactionStatusColor = () => {
    switch (transactionStatus) {
      case 'pending':
        return 'text-yellow-400';
      case 'confirmed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-6 relative`}>
      <div className="flex flex-col">
        <div className="absolute -top-3 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider">
          Credit Balance
        </div>
        <span className="font-medium text-white">
          Available Credit
        </span>
        <span className="text-2xl font-bold text-white mt-1">
          {formatCurrency(displayBalance, displayCurrency)}
        </span>

        {/* Transaction Status Message */}
        {transactionStatus !== 'idle' && (
          <div className="flex items-center gap-2 mt-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            )}
            <span className={`text-xs font-medium ${getTransactionStatusColor()}`}>
              {getTransactionStatusMessage()}
            </span>
            {status === 'confirmed' && confirmations > 0 && (
              <span className="text-xs text-gray-400">
                (
                {confirmations}
                {' '}
                confirmations)
              </span>
            )}
          </div>
        )}

        {/* Transaction Link */}
        {pendingTxHash && (
          <div className="mt-1">
            <a
              href={`https://polygonscan.com/tx/${pendingTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              View on PolygonScan
            </a>
          </div>
        )}

        {/* Error Message */}
        {pollingError && (
          <div className="mt-1 text-xs text-red-400">
            Error:
            {' '}
            {pollingError}
          </div>
        )}

        <span className="text-xs text-text-secondary leading-4.5 mt-1">
          {displayBalance > 0
            ? 'This credit will be automatically applied to your next invoice'
            : 'No available credit balance'}
        </span>
        <div className="flex flex-row gap-2 mt-4">
          <button
            onClick={() => {
              router.push('/payment-methods/top-up');
            }}
            className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
            type="button"
          >
            Top Up
          </button>
        </div>
      </div>
    </div>
  );
};
