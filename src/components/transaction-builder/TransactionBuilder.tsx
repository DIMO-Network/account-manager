'use client';

import type { SupportedChains } from '@/services/recovery/turnkey-bridge';
import type {
  RecoveryTemplate,
  TransactionBuilderConfig,
} from '@/services/transaction-builder';
import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import { useTransactionBuilder } from '@/hooks/useTransactionBuilder';
import { createRecoveryService } from '@/services/recovery/recovery-service';
import { getPublicClient } from '@/services/recovery/zerodev-service';
import { createTransactionBuilder, getContractAddresses, getNetworkConfig } from '@/services/transaction-builder';
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
  const previewRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<TransactionBuilderConfig>({
    network: networkId,
    contractAddress: '',
    abi: [],
    functionName: '',
    parameters: [],
    fromAddress: walletAddress,
  });

  const [selectedAction, setSelectedAction] = useState<RecoveryTemplate | null>(null);
  const [nativeBalance, setNativeBalance] = useState<bigint | null>(null);
  // Bumped to remount ParameterInputs when the amount is set from outside (e.g. "Use max")
  const [parameterInputsKey, setParameterInputsKey] = useState(0);
  // Bumped after a confirmed send so the balance (and "Use max") reflect what was spent
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

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

  const isNativeTransfer = Boolean(config.isNativeTransfer);
  const isCallConfigured = isNativeTransfer || Boolean(config.contractAddress && config.functionName);

  // Load the smart account's native balance so the user can send all of it
  useEffect(() => {
    const chainName = SUPPORTED_CHAINS[Number.parseInt(networkId) as keyof typeof SUPPORTED_CHAINS];
    if (!isNativeTransfer || !walletAddress || !chainName) {
      return;
    }

    let cancelled = false;
    getPublicClient(chainName as SupportedChains)
      .getBalance({ address: walletAddress as `0x${string}` })
      .then((balance) => {
        if (!cancelled) {
          setNativeBalance(balance);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNativeBalance(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isNativeTransfer, networkId, walletAddress, balanceRefreshKey]);

  // Any edit invalidates the preview, since execution sends exactly what was previewed
  const clearPreview = () => {
    setTransactionPreview(null);
    setSuccessMessage(null);
  };

  const handleTemplateSelect = (template: RecoveryTemplate) => {
    setSelectedAction(template);
    clearPreview();

    // Preselect first quick select token for ERC-20 transfers
    let initialContractAddress = '';
    if (template.id === 'erc20-transfer') {
      const defaultContracts = getContractAddresses('erc20', networkId);
      if (defaultContracts.length > 0 && defaultContracts[0]) {
        initialContractAddress = defaultContracts[0].address;
      }
    }

    setConfig({
      network: networkId,
      contractAddress: initialContractAddress,
      abi: template.abi,
      functionName: template.defaultFunction,
      parameters: template.parameterTemplates.map(p => p.value),
      isNativeTransfer: template.contractType === 'NATIVE',
      fromAddress: walletAddress,
    });
    setError(null);
  };

  const handleContractAddressChange = (address: string) => {
    setConfig(prev => ({ ...prev, contractAddress: address }));
    clearPreview();
    setError(null);
  };

  const handleParameterChange = (index: number, value: any) => {
    // Update from prev: ENS resolution calls this asynchronously and must not clobber newer edits
    setConfig((prev) => {
      const newParameters = [...prev.parameters];
      newParameters[index] = value;
      return { ...prev, parameters: newParameters };
    });
    clearPreview();
    setError(null);
  };

  const handleUseMaxBalance = () => {
    if (nativeBalance === null) {
      return;
    }

    // Gas is sponsored by the paymaster, so the full balance can be sent
    handleParameterChange(1, nativeBalance.toString());
    setParameterInputsKey(key => key + 1);
  };

  const handlePreviewTransaction = async () => {
    console.warn('Preview button clicked', { config, selectedAction, functionParameters });
    const missingFields: string[] = [];
    const validationErrors: string[] = [];

    if (!selectedAction) {
      missingFields.push('Recovery Action');
    }

    if (!isNativeTransfer && !config.contractAddress) {
      missingFields.push('Contract Address');
    }

    if (!isNativeTransfer && !config.functionName) {
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
            let weiValue = BigInt(0);
            try {
              weiValue = BigInt(String(value));
            } catch {
              // Not an integer wei amount; reported as invalid below
            }
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

      // Scroll to preview section after a brief delay
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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

    if (!transactionPreview) {
      setError('Preview the transaction before executing it');
      return;
    }

    // This preview was already sent; a new one is required to send again
    if (successMessage) {
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

      // Execute exactly what the user reviewed in the preview
      const result = await recoveryService.executeTransaction({
        targetChain: chainName as SupportedChains,
        to: transactionPreview.to,
        value: transactionPreview.value,
        data: transactionPreview.data,
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

        // Refresh the balance now that the transfer is on-chain
        setBalanceRefreshKey(key => key + 1);

        // Scroll to success message after a brief delay
        setTimeout(() => {
          successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

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

        {/* Locked while building or sending: an edit would clear the preview that shows the result */}
        <fieldset disabled={loading} className="space-y-6 min-w-0">
          {/* Recovery Templates */}
          <div className="flex flex-col gap-2">
            <p className={`text-xs ${COLORS.text.muted} mb-3`}>
              Select the type of asset you want to recover (native ETH, ERC-20 tokens or ERC-721 NFTs). ERC-20 transfers don't require approval.
            </p>
            <div className={`text-sm font-medium ${COLORS.text.secondary} mb-2`}>
              Asset Recovery Actions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => {
                const isSelected = selectedAction?.id === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`flex flex-col p-3 text-left ${BORDER_RADIUS.lg} border ${COLORS.background.tertiary} transition-colors cursor-pointer ${
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
                {isNativeTransfer
                  ? 'Native transfers send the network\'s currency (e.g. ETH) straight from your smart account. Gas is sponsored, so you can send your full balance.'
                  : 'ERC-20 transfers don\'t require approval. ERC-721 NFTs require approval before transfer. Select the appropriate action based on your asset type and current approval status.'}
              </p>
              <ul className="text-xs text-blue-800">
                <li>
                  Selected Action:
                  {' '}
                  {selectedAction.name}
                </li>
                {selectedAction.defaultFunction && (
                  <li>
                    Function:
                    {' '}
                    {selectedAction.defaultFunction}
                  </li>
                )}
                <li>
                  Contract Type:
                  {' '}
                  {selectedAction.contractType}
                </li>
              </ul>
            </div>
          )}

          {/* Contract Address - Only show when a contract action is selected */}
          {selectedAction && !isNativeTransfer && (
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
              key={parameterInputsKey}
              parameters={functionParameters}
              values={config.parameters}
              onParameterChangeAction={handleParameterChange}
              networkConfig={networkConfig}
              amountUnit={isNativeTransfer ? networkConfig?.nativeCurrency.symbol : undefined}
            />
          )}

          {/* Native balance of the smart account on this network */}
          {isNativeTransfer && nativeBalance !== null && (
            <div className={`flex items-center justify-between text-xs ${COLORS.text.muted}`}>
              <span>
                Available:
                {' '}
                {formatUnits(nativeBalance, networkConfig?.nativeCurrency.decimals ?? 18)}
                {' '}
                {networkConfig?.nativeCurrency.symbol || 'ETH'}
              </span>
              <button
                type="button"
                onClick={handleUseMaxBalance}
                disabled={nativeBalance === BigInt(0)}
                className="underline cursor-pointer disabled:cursor-not-allowed disabled:no-underline"
              >
                Use max
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePreviewTransaction}
              disabled={loading || !isCallConfigured}
              className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 ${
                loading || !isCallConfigured
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Building...' : 'Preview Transaction'}
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
        </fieldset>
      </div>

      {/* Transaction Preview */}
      {transactionPreview && (
        <div ref={previewRef}>
          <TransactionPreviewComponent
            preview={transactionPreview}
            networkConfig={networkConfig}
            walletAddress={walletAddress}
            onExecuteAction={handleExecuteTransaction}
            isExecuting={loading}
            successMessage={successMessage}
            successRef={successRef}
          />
        </div>
      )}
    </div>
  );
};
