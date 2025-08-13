'use client';

import { useState } from 'react';
import { encodeFunctionData } from 'viem';
import { useKernelSigner } from '@/hooks/useKernelSigner';
import { getDimoTokenContract } from '@/libs/TransactionsConfig';
import { RESPONSIVE } from '@/utils/designSystem';
import { getCurrentTokenConfig, SHARED_CONFIG } from '@/utils/TokenConfig';

type TransactionsSDKTopUpProps = {
  amount: number;
  onSuccessAction: () => void;
  onErrorAction: (error: unknown) => void;
};

export const TransactionsSDKTopUp = ({ amount, onSuccessAction, onErrorAction }: TransactionsSDKTopUpProps) => {
  const [loading, setLoading] = useState(false);
  const { getActiveClient, isInitialized, hasSession, error: kernelError } = useKernelSigner();

  const TOKEN_CONTRACT = getCurrentTokenConfig().contract;
  const RECIPIENT = SHARED_CONFIG.recipient;
  const TRANSFER_FEE = SHARED_CONFIG.transferFee;

  function toWei(amount: number): bigint {
    // Convert to wei (18 decimals)
    return BigInt(Math.floor(amount * 1e18));
  }

  const handleTopUp = async () => {
    if (!isInitialized) {
      onErrorAction(new Error('KernelSigner not initialized'));
      return;
    }

    if (kernelError) {
      onErrorAction(new Error(`KernelSigner error: ${kernelError}`));
      return;
    }

    if (!hasSession) {
      onErrorAction(new Error('No active session. Please authenticate with DIMO first.'));
      return;
    }

    setLoading(true);
    try {
      console.warn('Starting Transactions SDK top-up...');

      // Get the active client with proper error handling
      const client = await getActiveClient();
      if (!client) {
        throw new Error('Failed to get active client');
      }

      console.warn('Active client obtained, preparing transaction...');

      // Convert amounts to wei
      const transferAmountWei = toWei(amount);
      const feeAmountWei = toWei(TRANSFER_FEE);

      console.warn(`Transfer amount: ${transferAmountWei} wei, Fee: ${feeAmountWei} wei`);

      // Create batched transfer call data (fee + transfer)
      const batchedTransferCallData = await client.account.encodeCalls([
        {
          to: TOKEN_CONTRACT as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: getDimoTokenContract().abi,
            functionName: 'transfer',
            args: [RECIPIENT as `0x${string}`, feeAmountWei],
          }),
        },
        {
          to: TOKEN_CONTRACT as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: getDimoTokenContract().abi,
            functionName: 'transfer',
            args: [RECIPIENT as `0x${string}`, transferAmountWei],
          }),
        },
      ]);

      console.warn('Call data encoded, sending user operation...');

      // Send the user operation
      const txHash = await client.sendUserOperation({
        callData: batchedTransferCallData,
      });

      console.warn('User operation sent, waiting for receipt...');

      // Wait for receipt using the client's waitForUserOperationReceipt method
      const { receipt, success, reason } = await client.waitForUserOperationReceipt({
        hash: txHash,
      });

      if (success) {
        console.warn('Transaction successful:', receipt.transactionHash);
        onSuccessAction();
      } else {
        throw new Error(`Transaction failed: ${reason}`);
      }
    } catch (error) {
      console.error('Transaction error:', error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('No active session')) {
          onErrorAction(new Error('Please authenticate with DIMO first. You may need to sign in again.'));
        } else if (error.message.includes('No active client')) {
          onErrorAction(new Error('Authentication required. Please sign in with DIMO to continue.'));
        } else {
          onErrorAction(error);
        }
      } else {
        onErrorAction(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <button
        type="button"
        disabled
        className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-gray-500 text-white rounded-full font-medium opacity-50 cursor-not-allowed`}
      >
        Initializing...
      </button>
    );
  }

  if (kernelError) {
    return (
      <button
        type="button"
        disabled
        className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-red-500 text-white rounded-full font-medium opacity-50 cursor-not-allowed`}
      >
        Error:
        {' '}
        {kernelError}
      </button>
    );
  }

  if (!hasSession) {
    return (
      <button
        type="button"
        disabled
        className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-yellow-500 text-white rounded-full font-medium opacity-50 cursor-not-allowed`}
        title="You need to authenticate with DIMO first to use this feature"
      >
        Sign in with DIMO required
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleTopUp}
      disabled={loading}
      className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Processing...' : 'Add Credits'}
    </button>
  );
};
