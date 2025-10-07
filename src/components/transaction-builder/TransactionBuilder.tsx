'use client';

import type {
  RecoveryTemplate,
  TransactionBuilderConfig,
} from '@/services/transaction-builder';
import { useState } from 'react';
import { useTransactionBuilder } from '@/hooks/useTransactionBuilder';
import { createTransactionBuilder, getNetworkConfig } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { ContractSelector } from './ContractSelector';
import { ParameterInputs } from './ParameterInputs';
import { TransactionPreviewComponent } from './TransactionPreview';

type TransactionBuilderProps = {
  networkId: string;
  walletAddress: string;
  onTransactionExecutedAction?: (txHash: string) => void;
};

export const TransactionBuilder = ({
  networkId,
  walletAddress,
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
    setLoading,
    setError,
    setTransactionPreview,
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
    const missingFields: string[] = [];

    if (!selectedAction) {
      missingFields.push('Recovery Action');
    }

    if (!config.contractAddress) {
      missingFields.push('Contract Address');
    }

    if (!config.functionName) {
      missingFields.push('Function');
    }

    // Check if parameters are missing
    if (functionParameters.length > 0) {
      const missingParams = functionParameters
        .map((param, index) => {
          const value = config.parameters[index];
          if (!value || value === '' || value === '0') {
            return param.name;
          }
          return null;
        })
        .filter(Boolean);

      if (missingParams.length > 0) {
        missingFields.push(`Parameters: ${missingParams.join(', ')}`);
      }
    }

    if (missingFields.length > 0) {
      setError(`Please fill out the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const builder = createTransactionBuilder(config);
      const validation = builder.validateConfig();

      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      const preview = await builder.createTransactionPreview(walletAddress as `0x${string}`);
      setTransactionPreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransaction = async () => {
    // TODO: Implement transaction execution with ZeroDev signing
    console.warn('Executing transaction:', config);
    onTransactionExecutedAction?.('0x123...');
  };

  const networkConfig = getNetworkConfig(Number.parseInt(networkId));

  return (
    <div className="space-y-6">
      <div className={`${COLORS.background.secondary} ${BORDER_RADIUS.lg} p-6`}>
        <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-4`}>
          Build Recovery Transaction
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
              Select the type of asset you want to recover (ERC-20 tokens or ERC-721 NFTs). You may need to approve before transferring.
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
                For most tokens, you'll need to approve spending first, then transfer.
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

          {/* Contract Address */}
          <ContractSelector
            value={config.contractAddress}
            onChangeAction={handleContractAddressChange}
            networkConfig={networkConfig}
          />

          {/* Parameter Inputs */}
          {functionParameters.length > 0 && (
            <ParameterInputs
              parameters={functionParameters}
              values={config.parameters}
              onParameterChangeAction={handleParameterChange}
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
    </div>
  );
};
