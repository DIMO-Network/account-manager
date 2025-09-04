'use client';

import type { PublicClient } from 'viem';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'not-found';

type UseTransactionPollingProps = {
  txHash?: string;
  enabled?: boolean;
  onConfirmed?: () => void;
  onFailed?: () => void;
  pollInterval?: number;
};

type UseTransactionPollingReturn = {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  confirmations: number;
};

export function useTransactionPolling({
  txHash,
  enabled = true,
  onConfirmed,
  onFailed,
  pollInterval = 2000, // Poll every 2 seconds
}: UseTransactionPollingProps): UseTransactionPollingReturn {
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    if (!txHash || !enabled) {
      return;
    }

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;

    const pollTransaction = async () => {
      if (!isMounted) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create Viem client for Polygon
        const client: PublicClient = createPublicClient({
          chain: polygon,
          transport: http(),
        });

        // Get transaction receipt
        const receipt = await client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        if (receipt) {
          if (receipt.status === 'success') {
            setStatus('confirmed');
            // Calculate confirmations by getting current block number
            try {
              const currentBlock = await client.getBlockNumber();
              const confirmations = Number(currentBlock - receipt.blockNumber + BigInt(1));
              setConfirmations(confirmations);
            } catch {
              // If we can't get block number, just set to 1
              setConfirmations(1);
            }
            onConfirmed?.();
            // Stop polling on success
          } else if (receipt.status === 'reverted') {
            setStatus('failed');
            onFailed?.();
            // Stop polling on failure
          }
        } else {
          // Transaction not found yet, continue polling
          setStatus('pending');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to check transaction';
          setError(errorMessage);
          console.error('Transaction polling error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);

          // Continue polling if transaction is still pending
          if (status === 'pending') {
            pollTimeout = setTimeout(pollTransaction, pollInterval);
          }
        }
      }
    };

    // Start polling
    pollTransaction();

    return () => {
      isMounted = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [txHash, enabled, onConfirmed, onFailed, pollInterval, status]);

  return {
    status,
    isLoading,
    error,
    confirmations,
  };
}
