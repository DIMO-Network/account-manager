'use client';

import type { PublicClient } from 'viem';
import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { clientLogger } from '@/libs/ClientLogger';

type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'not-found';

type UseTransactionPollingProps = {
  txHash?: string;
  enabled?: boolean;
  onConfirmed?: (usdValue?: number) => void;
  onFailed?: () => void;
  pollInterval?: number;
};

type UseTransactionPollingReturn = {
  status: TransactionStatus;
  isLoading: boolean;
  error: string | null;
  confirmations: number;
};

// Extract USD value from DIMO transaction
async function extractUsdValueFromTransaction(client: PublicClient, txHash: `0x${string}`): Promise<number | undefined> {
  clientLogger.info('extractUsdValueFromTransaction: Starting extraction for:', txHash);

  try {
    // Get the transaction receipt to access logs
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    clientLogger.info('extractUsdValueFromTransaction: Got transaction receipt:', {
      status: receipt?.status,
      logsCount: receipt?.logs?.length || 0,
    });

    if (!receipt) {
      clientLogger.warn('extractUsdValueFromTransaction: No transaction receipt found');
      return undefined;
    }

    // DIMO token contract address (from TokenConfig)
    const DIMO_CONTRACT = '0xE261D618a959aFfFd53168Cd07D12E37B26761db';

    // Find Transfer events from the DIMO contract
    const transferLogs = receipt.logs.filter(log =>
      log.address.toLowerCase() === DIMO_CONTRACT.toLowerCase(),
    );

    clientLogger.info('extractUsdValueFromTransaction: Found DIMO transfer logs:', {
      totalLogs: receipt.logs.length,
      dimoLogs: transferLogs.length,
      dimoContract: DIMO_CONTRACT,
    });

    if (transferLogs.length === 0) {
      clientLogger.warn('extractUsdValueFromTransaction: No DIMO Transfer events found');
      return undefined;
    }

    // For now, we'll use a simplified approach to extract the value from logs
    // In a real implementation, you'd decode the ERC-20 Transfer event logs
    // to get the exact DIMO amount transferred

    // Look for Transfer event logs (topic[0] = Transfer event signature)
    const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    let totalDimoAmount = BigInt(0);
    for (const log of transferLogs) {
      if (log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
        // Extract the value from the log data (topics[3] for Transfer events)
        // The value is in the data field as a 32-byte hex string
        const valueHex = log.data.slice(2); // Remove '0x' prefix
        const value = BigInt(`0x${valueHex}`);
        totalDimoAmount += value;

        clientLogger.info('extractUsdValueFromTransaction: Found Transfer event:', {
          value: value.toString(),
          from: log.topics[1],
          to: log.topics[2],
        });
      }
    }

    if (totalDimoAmount === BigInt(0)) {
      clientLogger.warn('extractUsdValueFromTransaction: No DIMO amount found in Transfer events');
      return undefined;
    }

    // Convert from wei to DIMO (18 decimals)
    const dimoAmount = Number(totalDimoAmount) / 1e18;

    // Get current DIMO price
    const priceResponse = await fetch('/api/dimo-price');
    if (!priceResponse.ok) {
      clientLogger.warn('Failed to fetch DIMO price');
      return undefined;
    }

    const priceData = await priceResponse.json();
    const dimoPrice = Number(priceData.price);

    // Calculate USD value
    const usdValue = dimoAmount * dimoPrice;

    clientLogger.info('Extracted transaction data (ERC-20):', {
      dimoAmount,
      dimoPrice,
      usdValue,
      totalDimoAmount: totalDimoAmount.toString(),
      transferLogsCount: transferLogs.length,
    });

    return usdValue;
  } catch (error) {
    clientLogger.error('Error extracting USD value from transaction:', error);
    return undefined;
  }
}

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
    clientLogger.info('useTransactionPolling: Effect triggered', { enabled, txHash });

    if (!txHash || !enabled) {
      clientLogger.info('useTransactionPolling: Not enabled or no txHash', { enabled, txHash });
      return;
    }

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;
    let continuePollingTimeout: NodeJS.Timeout;
    let isPolling = false; // Prevent multiple concurrent polling loops

    const pollTransaction = async () => {
      if (!isMounted || isPolling) {
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
        const receipt = await client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

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
            setStatus('confirmed');

            // Try to extract USD value from transaction logs
            let usdValue: number | undefined;
            try {
              usdValue = await extractUsdValueFromTransaction(client, txHash as `0x${string}`);
            } catch (error) {
              console.error('Could not extract USD value from transaction:', error);
            }

            onConfirmed?.(usdValue);
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
          isPolling = false; // Reset polling flag

          // Continue polling if transaction is still pending
          // Check current status from state to avoid closure issues
          continuePollingTimeout = setTimeout(() => {
            if (isMounted) {
              // Use a callback to get the current status
              setStatus((currentStatus) => {
                if (currentStatus === 'pending') {
                  pollTimeout = setTimeout(pollTransaction, pollInterval);
                }
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
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
      if (continuePollingTimeout) {
        clearTimeout(continuePollingTimeout);
      }
    };
  }, [txHash, enabled, pollInterval, onConfirmed, onFailed]);

  return {
    status,
    isLoading,
    error,
    confirmations,
  };
}
