'use client';

import type { NetworkConfig, TransactionPreview } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type TransactionPreviewProps = {
  preview: TransactionPreview;
  networkConfig: NetworkConfig | null;
  walletAddress: string;
  onExecuteAction: () => void;
  isExecuting?: boolean;
  successMessage?: {
    transactionHash: string;
    explorerUrl: string;
  } | null;
  successRef?: React.RefObject<HTMLDivElement | null>;
};

export const TransactionPreviewComponent = ({
  preview,
  networkConfig,
  walletAddress,
  onExecuteAction,
  isExecuting = false,
  successMessage,
  successRef,
}: TransactionPreviewProps) => {
  if (!preview) {
    return null;
  }
  const formatValue = (value: bigint): string => {
    return value.toString();
  };

  const truncateAddress = (address: string | undefined): string => {
    if (!address || typeof address !== 'string') {
      return '0x0000...0000';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`${COLORS.background.secondary} ${BORDER_RADIUS.lg} border ${COLORS.border.default} p-6`}>
      <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-2`}>
        3. Transaction Preview
      </h3>
      <p className={`text-sm ${COLORS.text.muted} mb-4`}>
        Review the transaction details before executing. This will be sent to the blockchain.
      </p>

      <div className="space-y-4">
        {/* Network Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Target Network:</strong>
            <br />
            {networkConfig?.name || 'Unknown Network'}
            {' '}
            (Chain ID:
            {' '}
            {networkConfig?.chainId}
            )
          </p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`text-sm font-medium ${COLORS.text.muted}`}>From (Your Smart Account):</span>
            <span className={`text-sm ${COLORS.text.primary} font-mono`}>
              {truncateAddress(walletAddress)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={`text-sm font-medium ${COLORS.text.muted}`}>To (Target Contract):</span>
            <span className={`text-sm ${COLORS.text.primary} font-mono`}>
              {truncateAddress(preview.to)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={`text-sm font-medium ${COLORS.text.muted}`}>Function to Call:</span>
            <span className={`text-sm ${COLORS.text.primary} font-mono`}>
              {preview.functionName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className={`text-sm font-medium ${COLORS.text.muted}`}>Value:</span>
            <span className={`text-sm ${COLORS.text.primary}`}>
              {formatValue(preview.value)}
              {' '}
              {networkConfig?.nativeCurrency.symbol || 'ETH'}
            </span>
          </div>

          {preview.estimatedCost.includes('Sponsored')
            ? (
                <div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${COLORS.text.muted}`}>Gas:</span>
                    <span className="text-sm font-semibold text-green-600 text-right">
                      {preview.estimatedCost}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    You don't need to pay any ETH for gas costs
                  </div>
                </div>
              )
            : (
                <>
                  <div className="flex justify-between">
                    <span className={`text-sm font-medium ${COLORS.text.muted}`}>Gas Limit:</span>
                    <span className={`text-sm ${COLORS.text.primary}`}>
                      {preview.gasLimit.toString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className={`text-sm font-medium ${COLORS.text.muted}`}>Gas Price:</span>
                    <span className={`text-sm ${COLORS.text.primary}`}>
                      {preview.gasPrice.toString()}
                      {' '}
                      wei
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className={`text-sm font-medium ${COLORS.text.muted}`}>Estimated Cost:</span>
                    <span className={`text-sm font-semibold ${COLORS.text.primary}`}>
                      {preview.estimatedCost}
                    </span>
                  </div>
                </>
              )}
        </div>

        {/* Parameters */}
        {preview.parameters.length > 0 && (
          <div>
            <h4 className={`text-sm font-medium ${COLORS.text.secondary} mb-2`}>Parameters:</h4>
            <div className="space-y-2">
              {preview.parameters.map(param => (
                <div key={`${param.name}`} className="flex justify-between text-sm">
                  <span className={COLORS.text.muted}>
                    {param.name}
                    :
                  </span>
                  <span className={`${COLORS.text.primary} font-mono`}>
                    {typeof param.value === 'string' && param.value.length > 20
                      ? `${truncateAddress(param.value)}`
                      : String(param.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Data */}
        <div>
          <h4 className={`text-sm font-medium ${COLORS.text.secondary} mb-2`}>Transaction Data:</h4>
          <div className={`p-3 ${COLORS.background.tertiary} ${BORDER_RADIUS.md}`}>
            <code className={`text-xs ${COLORS.text.muted} break-all`}>
              {preview.data}
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 pt-4 border-t ${COLORS.border.default}`}>
          <button
            type="button"
            onClick={onExecuteAction}
            disabled={isExecuting}
            className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 cursor-pointer ${
              isExecuting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExecuting ? 'Confirming...' : 'Execute Transaction'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div ref={successRef} className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 mb-1">
                  Transaction Successful
                </h3>
                <p className="text-xs text-green-800 mb-3">
                  Your transaction has been submitted and confirmed on the blockchain. You may leave this page now. If you would like to create a new transaction, please preview a new transaction before executing again.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={successMessage.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 mt-1 underline hover:text-green-800"
                    >
                      View on Blockchain Explorer →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
