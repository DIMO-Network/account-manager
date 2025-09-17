'use client';

import { clientLogger } from '@/libs/ClientLogger';
import { useEffect, useRef, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'not-found';

type UseTransactionPollingProps = {
  txHash?: string;
  enabled?: boolean;
  onConfirmed?: (usdValue?: number) => void;
  onFailed?: (errorMessage?: string) => void;
  onAlreadyProcessed?: () => void;
  pollInterval?: number;
};

type UseTransactionPollingReturn = {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  confirmations: number;
};

// Validate transaction and extract USD value
async function validateTransactionAndExtractUsdValue(txHash: `0x${string}`): Promise<number | undefined> {
  clientLogger.info('validateTransactionAndExtractUsdValue: Starting validation for:', txHash);

  try {
    const response = await fetch('/api/transaction/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txHash }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      clientLogger.warn('validateTransactionAndExtractUsdValue: Validation failed:', {
        status: response.status,
        error: errorData.error,
        alreadyProcessed: errorData.alreadyProcessed,
      });

      // For already processed transactions, throw a specific error
      if (errorData.alreadyProcessed) {
        clientLogger.info('validateTransactionAndExtractUsdValue: Throwing ALREADY_PROCESSED error');
        throw new Error('ALREADY_PROCESSED');
      }

      // Throw an error to stop polling when validation fails
      throw new Error(errorData.error || 'Transaction validation failed');
    }

    const validationData = await response.json();

    clientLogger.info('validateTransactionAndExtractUsdValue: Validation successful:', {
      dimoAmount: validationData.dimoAmount,
      usdValue: validationData.usdValue,
      transactionFrom: validationData.transactionFrom,
      userWallet: validationData.userWallet,
    });

    return validationData.usdValue;
  } catch (error) {
    clientLogger.error('validateTransactionAndExtractUsdValue: Error validating transaction:', error);
    // Re-throw the error so it can be handled by the polling function
    throw error;
  }
}

export function useTransactionPolling({
  txHash,
  enabled = true,
  onConfirmed,
  onFailed,
  onAlreadyProcessed,
  pollInterval = 2000, // Poll every 2 seconds
}: UseTransactionPollingProps): UseTransactionPollingReturn {
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmations, setConfirmations] = useState(0);

  // Store callbacks in refs to avoid dependency issues
  const onConfirmedRef = useRef(onConfirmed);
  const onFailedRef = useRef(onFailed);
  const onAlreadyProcessedRef = useRef(onAlreadyProcessed);

  // Update refs when callbacks change
  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
    onFailedRef.current = onFailed;
    onAlreadyProcessedRef.current = onAlreadyProcessed;
  }, [onConfirmed, onFailed, onAlreadyProcessed]);

  useEffect(() => {
    clientLogger.info('useTransactionPolling: Effect triggered', { enabled, txHash });

    if (!txHash || !enabled) {
      clientLogger.info('useTransactionPolling: Not enabled or no txHash', { enabled, txHash });
      return;
    }

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;
    let continuePollingTimeout: NodeJS.Timeout;
    let isPolling = false; // Prevent multiple concurrent polling loops
    let isCompleted = false; // Flag to stop polling after success or failure
    const startTime = Date.now();
    const MAX_POLLING_DURATION = 60 * 1000; // 1 minute

    // Reset completion flag when starting new polling session
    isCompleted = false;

    const pollTransaction = async () => {
      if (!isMounted || isPolling || isCompleted) {
        return;
      }

      // Check if we've been polling too long
      if (Date.now() - startTime > MAX_POLLING_DURATION) {
        clientLogger.warn('useTransactionPolling: Polling timeout reached, stopping');
        setStatus('failed');
        onFailedRef.current?.('Transaction polling timeout - transaction may not exist');
        isCompleted = true;
        return;
      }

      isPolling = true;
      clientLogger.info('useTransactionPolling: Polling transaction:', txHash);

      try {
        setIsLoading(true);
        setError(null);

        // Create Viem client for Polygon
        const client = createPublicClient({
          chain: polygon,
          transport: http(),
        });

        // Get transaction receipt
        let receipt;
        try {
          receipt = await client.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          });
        } catch (error) {
          // Handle transaction not found error
          if (error instanceof Error && error.message.includes('Transaction receipt with hash') && error.message.includes('could not be found')) {
            clientLogger.info('useTransactionPolling: Transaction not found yet, continuing to poll');
            // Transaction not found yet, continue polling
            return;
          }
          // Re-throw other errors
          throw error;
        }

        if (receipt) {
          // Calculate confirmations by getting current block number
          try {
            const currentBlock = await client.getBlockNumber();
            const confirmations = Number(currentBlock - receipt.blockNumber);
            setConfirmations(confirmations);
          } catch {
            // If we can't get block number, just set to 1
            setConfirmations(1);
          }

          if (receipt.status === 'success') {
            // Try to validate transaction and extract USD value
            let usdValue: number | undefined;
            let validationSuccess = false;

            try {
              usdValue = await validateTransactionAndExtractUsdValue(txHash as `0x${string}`);
              validationSuccess = true;
            } catch (error) {
              clientLogger.error('Could not validate transaction and extract USD value:', error);

              // Check if this is an "already processed" error
              if (error instanceof Error && error.message === 'ALREADY_PROCESSED') {
                clientLogger.info('useTransactionPolling: Detected ALREADY_PROCESSED error, calling onAlreadyProcessed');
                // Don't set status here - let the callback handle it
                onAlreadyProcessedRef.current?.();
                isCompleted = true; // Stop polling on already processed
                return;
              }

              // If validation fails, treat as failed transaction
              setStatus('failed');
              const errorMessage = error instanceof Error ? error.message : 'Transaction validation failed';
              onFailedRef.current?.(errorMessage);
              isCompleted = true; // Stop polling on validation failure
              return;
            }

            if (validationSuccess) {
              setStatus('confirmed'); // Only set to confirmed after validation succeeds
              onConfirmedRef.current?.(usdValue);
              isCompleted = true; // Stop polling on success
            }
          } else if (receipt.status === 'reverted') {
            setStatus('failed');
            onFailedRef.current?.('Transaction was reverted on the blockchain');
            isCompleted = true; // Stop polling on failure
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
          isPolling = false; // Reset polling flag

          // Continue polling only if transaction is still pending and not completed
          // Check current status from state to avoid closure issues
          continuePollingTimeout = setTimeout(() => {
            if (isMounted && !isCompleted) {
              // Use a callback to get the current status
              setStatus((currentStatus) => {
                if (currentStatus === 'pending') {
                  pollTimeout = setTimeout(pollTransaction, pollInterval);
                }
                // Stop polling for 'confirmed' or 'failed' status
                return currentStatus;
              });
            }
          }, 0);
        }
      }
    };

    // Start polling
    pollTransaction();

    return () => {
      isMounted = false;
      isCompleted = true; // Stop any ongoing polling
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
      if (continuePollingTimeout) {
        clearTimeout(continuePollingTimeout);
      }
    };
  }, [txHash, enabled, pollInterval]);

  return {
    status,
    isLoading,
    error,
    confirmations,
  };
}
