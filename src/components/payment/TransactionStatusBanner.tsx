'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTransactionPolling } from '@/hooks/useTransactionPolling';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

type TransactionStatusBannerProps = {
  onTransactionConfirmedAction: () => void;
};

export const TransactionStatusBanner = ({ onTransactionConfirmedAction }: TransactionStatusBannerProps) => {
  const searchParams = useSearchParams();
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const hasProcessedUrl = useRef(false);

  // Get pending transaction hash from URL parameters
  useEffect(() => {
    if (hasProcessedUrl.current) {
      return;
    }

    const txHash = searchParams.get('transactionHash');
    if (txHash) {
      hasProcessedUrl.current = true;
      // Clear the URL parameter to avoid showing the banner on subsequent visits
      const url = new URL(window.location.href);
      url.searchParams.delete('transactionHash');
      window.history.replaceState({}, '', url.toString());

      // Use setTimeout to avoid direct setState in useEffect
      const timeoutId = setTimeout(() => {
        setPendingTxHash(txHash);
      }, 0);

      // Cleanup function to clear timeout
      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Return undefined for code paths without transaction hash
    return undefined;
  }, [searchParams]);

  const { status, isLoading, error, confirmations } = useTransactionPolling({
    txHash: pendingTxHash || undefined,
    enabled: !!pendingTxHash,
    onConfirmed: () => {
      // Clear the transaction hash
      setPendingTxHash(null);
      // Notify parent component to refresh credit balance
      onTransactionConfirmedAction();
    },
    onFailed: () => {
      // Clear the transaction hash on failure
      setPendingTxHash(null);
    },
  });

  // Don't render if no pending transaction
  if (!pendingTxHash) {
    return null;
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Transaction pending...';
      case 'confirmed':
        return 'Transaction confirmed!';
      case 'failed':
        return 'Transaction failed';
      case 'not-found':
        return 'Transaction not found';
      default:
        return 'Checking transaction...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
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
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4 border border-gray-700`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span className={`${RESPONSIVE.text.body} font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
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

        {pendingTxHash && (
          <a
            href={`https://polygonscan.com/tx/${pendingTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            View on PolygonScan
          </a>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400">
          Error:
          {' '}
          {error}
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-2 text-xs text-gray-400">
          Transaction is being processed on the blockchain.
        </div>
      )}
    </div>
  );
};
