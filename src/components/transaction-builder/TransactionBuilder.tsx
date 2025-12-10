'use client';

import type { SupportedChains } from '@/services/recovery/turnkey-bridge';
import type {
  RecoveryTemplate,
  TransactionBuilderConfig,
} from '@/services/transaction-builder';
import { useState } from 'react';
import { useTransactionBuilder } from '@/hooks/useTransactionBuilder';
import { createRecoveryService } from '@/services/recovery/recovery-service';
import { createTransactionBuilder, getNetworkConfig } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { ContractSelector } from './ContractSelector';
import { ParameterInputs } from './ParameterInputs';
import { TransactionPreviewComponent } from './TransactionPreview';

const SUPPORTED_CHAINS = {
  1: 'ETHEREUM',
  137: 'POLYGON',
  8453: 'BASE',
  11155111: 'ETHEREUM',
  80002: 'POLYGON',
  84532: 'BASE',
} as const;

type TransactionBuilderProps = {
  networkId: string;
  walletAddress: string;
  sessionData: {
    dimoToken: string;
    subOrganizationId: string;
    walletAddress: string;
  } | null;
  onTransactionExecutedAction?: (txHash: string) => void;
};

export const TransactionBuilder = ({
  networkId,
  walletAddress,
  sessionData,
  onTransactionExecutedAction,
}: TransactionBuilderProps) => {
  const [config, setConfig] = useState<TransactionBuilderConfig>({
    network: networkId,
    contractAddress: '',
    abi: [],
    functionName: '',
    parameters: [],
  });

  const [selectedAction, setSelectedAction] = useState<RecoveryTemplate | null>(null);

  const {
    templates,
    functionParameters,
    transactionPreview,
    loading,
    error,
    successMessage,
    setLoading,
    setError,
    setTransactionPreview,
    setSuccessMessage,
  } = useTransactionBuilder(config);

  const handleTemplateSelect = (template: RecoveryTemplate) => {
    setSelectedAction(template);
    setConfig({
      network: networkId,
      contractAddress: '',
      abi: template.abi,
      functionName: template.defaultFunction,
      parameters: template.parameterTemplates.map(p => p.value),
    });
    setError(null);
  };

  const handleContractAddressChange = (address: string) => {
    setConfig(prev => ({ ...prev, contractAddress: address }));
    setError(null);
  };

  const handleParameterChange = (index: number, value: any) => {
    const newParameters = [...config.parameters];
    newParameters[index] = value;
    setConfig(prev => ({ ...prev, parameters: newParameters }));
    setError(null);
  };

  const handlePreviewTransaction = async () => {
    console.warn('Preview button clicked', { config, selectedAction, functionParameters });
    const missingFields: string[] = [];
    const validationErrors: string[] = [];

    if (!selectedAction) {
      missingFields.push('Recovery Action');
    }

    if (!config.contractAddress) {
      missingFields.push('Contract Address');
    }

    if (!config.functionName) {
      missingFields.push('Function');
    }

    // Enhanced parameter validation
    if (functionParameters.length > 0) {
      functionParameters.forEach((param, index) => {
        const value = config.parameters[index];

        // Check if required parameter is missing
        if (param.required && (!value || value === '' || value === '0')) {
          missingFields.push(param.name);
          return;
        }

        // Validate parameter types and values
        if (value && value !== '') {
          // Validate addresses
          if (param.type === 'address') {
            const addressValue = String(value);
            if (!addressValue.startsWith('0x') || addressValue.length !== 42) {
              validationErrors.push(`${param.name} must be a valid Ethereum address (0x...)`);
            }
          }

          // Validate token amounts
          // Note: value is in wei (smallest unit), so we need to convert back to tokens for validation
          if (param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value'))) {
            const weiValue = BigInt(String(value));
            if (weiValue <= BigInt(0)) {
              validationErrors.push(`${param.name} must be a valid positive number`);
            } else {
              // Convert wei to tokens (divide by 10^18) for validation
              const tokenValue = Number(weiValue) / 1e18;
              if (tokenValue > 1e9) {
                validationErrors.push(`${param.name} amount seems too large (max 1 billion tokens)`);
              }
            }
          }

          // Validate token IDs for ERC-721
          if (param.type === 'uint256' && param.name.toLowerCase().includes('tokenid')) {
            const numValue = Number(value);
            if (Number.isNaN(numValue) || numValue < 0 || !Number.isInteger(numValue)) {
              validationErrors.push(`${param.name} must be a valid token ID (whole number)`);
            }
          }

          // Validate boolean values
          if (param.type === 'bool') {
            if (value !== 'true' && value !== 'false') {
              validationErrors.push(`${param.name} must be true or false`);
            }
          }
        }
      });
    }

    // Show missing fields error
    if (missingFields.length > 0) {
      const errorMsg = `Please fill out the following required fields: ${missingFields.join(', ')}`;
      console.warn('Missing fields:', missingFields);
      setError(errorMsg);
      return;
    }

    // Show validation errors
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join('. ');
      console.warn('Validation errors:', validationErrors);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.warn('Creating transaction builder with config:', config);
      const builder = createTransactionBuilder(config);
      const validation = builder.validateConfig();

      if (!validation.isValid) {
        console.warn('Config validation failed:', validation.errors);
        setError(validation.errors.join(', '));
        setLoading(false);
        return;
      }

      console.warn('Creating transaction preview...');
      const preview = await builder.createTransactionPreview();
      console.warn('Transaction preview created:', preview);
      setTransactionPreview(preview);
    } catch (err) {
      console.error('Preview transaction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransaction = async () => {
    if (!sessionData) {
      setError('Session data not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recoveryService = await createRecoveryService(sessionData);

      const chainName = SUPPORTED_CHAINS[Number.parseInt(networkId) as keyof typeof SUPPORTED_CHAINS];

      if (!chainName) {
        throw new Error('Unsupported network selected');
      }

      const result = await recoveryService.executeTransaction({
        targetChain: chainName as SupportedChains,
        contractAddress: config.contractAddress,
        abi: config.abi,
        functionName: config.functionName,
        parameters: config.parameters,
        value: BigInt(0),
      });

      if (result.success && result.transactionHash) {
        // Get explorer URL for the current network
        const networkConfig = getNetworkConfig(Number.parseInt(networkId));
        const explorerUrl = networkConfig?.explorerUrl || 'https://etherscan.io';

        // Set success message with transaction link
        setSuccessMessage({
          transactionHash: result.transactionHash,
          explorerUrl: `${explorerUrl}/tx/${result.transactionHash}`,
        });

        // Clear any previous errors
        setError(null);

        // Call the callback for external handling
        onTransactionExecutedAction?.(result.transactionHash);
      } else {
        setError(result.error || 'Transaction execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction execution failed');
    } finally {
      setLoading(false);
    }
  };

  const networkConfig = getNetworkConfig(Number.parseInt(networkId));

  return (
    <div className="space-y-6">
      <div className={`${COLORS.background.secondary} ${BORDER_RADIUS.lg} p-6`}>
        <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-4`}>
          2. Build Recovery Transaction
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Recovery Templates */}
          <div>
            <div className={`text-sm font-medium ${COLORS.text.secondary} mb-2`}>
              Asset Recovery Actions
            </div>
            <p className={`text-xs ${COLORS.text.muted} mb-3`}>
              Select the type of asset you want to recover (ERC-20 tokens or ERC-721 NFTs). ERC-20 transfers don't require approval.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => {
                const isSelected = selectedAction?.id === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`flex flex-col p-3 text-left ${BORDER_RADIUS.lg} border ${COLORS.background.tertiary} transition-colors ${
                      isSelected
                        ? 'border-white'
                        : 'border-transparent hover:border-white'
                    }`}
                  >
                    <div className={`font-medium ${COLORS.text.primary}`}>
                      {template.name}
                    </div>
                    <div className={`text-sm ${COLORS.text.muted}`}>{template.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Action Info */}
          {selectedAction && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm mb-3">
                <strong>Recovery Workflow:</strong>
                <br />
                ERC-20 transfers don't require approval. ERC-721 NFTs require approval before transfer.
                Select the appropriate action based on your asset type and current approval status.
              </p>
              <ul className="text-xs text-blue-800">
                <li>
                  Selected Action:
                  {' '}
                  {selectedAction.name}
                </li>
                <li>
                  Function:
                  {' '}
                  {selectedAction.defaultFunction}
                </li>
                <li>
                  Contract Type:
                  {' '}
                  {selectedAction.contractType}
                </li>
              </ul>
            </div>
          )}

          {/* Contract Address - Only show when action is selected */}
          {selectedAction && (
            <ContractSelector
              value={config.contractAddress}
              onChangeAction={handleContractAddressChange}
              networkConfig={networkConfig}
              selectedAction={selectedAction?.id}
              networkId={networkId}
            />
          )}

          {/* Parameter Inputs */}
          {functionParameters.length > 0 && (
            <ParameterInputs
              parameters={functionParameters}
              values={config.parameters}
              onParameterChangeAction={handleParameterChange}
              networkConfig={networkConfig}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreviewTransaction}
              disabled={loading || !config.contractAddress || !config.functionName}
              className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 ${
                loading || !config.contractAddress || !config.functionName
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Building...' : 'Preview Recovery Transaction'}
            </button>
          </div>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-2">
              Debug: contractAddress=
              {config.contractAddress ? 'set' : 'missing'}
              , functionName=
              {config.functionName ? 'set' : 'missing'}
              , selectedAction=
              {selectedAction ? 'set' : 'missing'}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Preview */}
      {transactionPreview && (
        <TransactionPreviewComponent
          preview={transactionPreview}
          networkConfig={networkConfig}
          walletAddress={walletAddress}
          onExecuteAction={handleExecuteTransaction}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 mb-1">
                Transaction Successful!
              </h3>
              <p className="text-xs text-green-800 mb-3">
                Your recovery transaction has been submitted and confirmed on the blockchain.
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
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className={`shrink-0 text-gray-400 hover:text-gray-600 ${BORDER_RADIUS.sm} p-1`}
            >
              <span className="text-sm">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
