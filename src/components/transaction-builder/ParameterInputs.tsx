'use client';

import type { FunctionParameter, NetworkConfig } from '@/services/transaction-builder';
import { useMemo, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { COLORS } from '@/utils/designSystem';

type ParameterInputsProps = {
  parameters: FunctionParameter[];
  values: (string | number | boolean)[];
  onParameterChangeAction: (index: number, value: string | number | boolean) => void;
  networkConfig: NetworkConfig | null;
};

export const ParameterInputs = ({
  parameters,
  values,
  onParameterChangeAction,
  networkConfig,
}: ParameterInputsProps) => {
  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const getExplorerUrl = (address: string): string => {
    if (!networkConfig || !validateAddress(address)) {
      return '#';
    }
    return `${networkConfig.explorerUrl}/address/${address}`;
  };
  // Local state to store user input values (human-readable)
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [ensResolving, setEnsResolving] = useState<boolean[]>([]);
  const [ensErrors, setEnsErrors] = useState<string[]>([]);
  const [resolvedAddresses, setResolvedAddresses] = useState<string[]>([]);

  // Compute display values from input values or convert wei back to tokens
  const displayValues = useMemo(() => {
    return parameters.map((param, index) => {
      const inputValue = inputValues[index];
      const weiValue = values[index] || '';

      // If user has typed something, use their input
      if (inputValue !== undefined) {
        return inputValue;
      }

      // Otherwise, convert wei back to human-readable for display
      if (param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value'))) {
        if (weiValue && !Number.isNaN(Number(weiValue)) && Number(weiValue) > 0) {
          // Convert wei back to tokens: divide by 10^18
          const tokenAmount = (Number(weiValue) / 1e18).toString();
          return tokenAmount;
        }
      }

      return weiValue.toString();
    });
  }, [parameters, values, inputValues]);

  // Create viem client for ENS resolution (only for Ethereum mainnet and Sepolia)
  const getViemClient = () => {
    if (!networkConfig) {
      return null;
    }

    // Only support ENS on Ethereum networks
    if (networkConfig.chainId === 1) {
      return createPublicClient({
        chain: mainnet,
        transport: http(networkConfig.rpcUrl),
      });
    } else if (networkConfig.chainId === 11155111) {
      return createPublicClient({
        chain: sepolia,
        transport: http(networkConfig.rpcUrl),
      });
    }

    return null;
  };

  // Resolve ENS name to address
  const resolveEnsName = async (ensName: string, paramIndex: number) => {
    const client = getViemClient();
    if (!client) {
      setEnsErrors((prev) => {
        const newErrors = [...prev];
        newErrors[paramIndex] = 'ENS resolution not supported on this network';
        return newErrors;
      });
      return;
    }

    setEnsResolving((prev) => {
      const newResolving = [...prev];
      newResolving[paramIndex] = true;
      return newResolving;
    });

    setEnsErrors((prev) => {
      const newErrors = [...prev];
      newErrors[paramIndex] = '';
      return newErrors;
    });

    try {
      const address = await client.getEnsAddress({
        name: ensName,
      });

      if (address) {
        // Store the resolved address for display
        setResolvedAddresses((prev) => {
          const newAddresses = [...prev];
          newAddresses[paramIndex] = address;
          return newAddresses;
        });

        // Update the parent component with the resolved address
        onParameterChangeAction(paramIndex, address);
      } else {
        setEnsErrors((prev) => {
          const newErrors = [...prev];
          newErrors[paramIndex] = 'ENS name not found';
          return newErrors;
        });
      }
    } catch (error) {
      setEnsErrors((prev) => {
        const newErrors = [...prev];
        newErrors[paramIndex] = `ENS resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return newErrors;
      });
    } finally {
      setEnsResolving((prev) => {
        const newResolving = [...prev];
        newResolving[paramIndex] = false;
        return newResolving;
      });
    }
  };

  // Check if input looks like an ENS name
  const isEnsName = (value: string): boolean => {
    return value.endsWith('.eth') && value.length > 4 && !value.startsWith('0x');
  };

  if (parameters.length === 0) {
    return null;
  }

  const getInputType = (type: string): string => {
    if (type.includes('uint') || type.includes('int')) {
      return 'number';
    }
    if (type === 'bool') {
      return 'checkbox';
    }
    if (type === 'address') {
      return 'text';
    }
    return 'text';
  };

  const getPlaceholder = (type: string): string => {
    if (type.includes('uint') || type.includes('int')) {
      return '0';
    }
    if (type === 'address') {
      return '0x...';
    }
    if (type === 'bool') {
      return '';
    }
    if (type === 'string') {
      return 'Enter text...';
    }
    return 'Enter value...';
  };

  const getParameterDescription = (name: string, type: string): string => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('token') && lowerName.includes('id')) {
      return 'The unique identifier of the NFT or token';
    }
    if (lowerName.includes('to') || lowerName.includes('recipient')) {
      return 'The address that will receive the tokens/assets';
    }
    if (lowerName.includes('amount') || lowerName.includes('value')) {
      return 'Amount in DIMO tokens';
    }
    if (lowerName.includes('from') || lowerName.includes('sender')) {
      return 'The address sending the tokens/assets';
    }
    if (type.includes('address')) {
      return 'A valid Ethereum address (0x...) or ENS name (e.g., jaggedbytes.eth)';
    }
    if (type.includes('uint') || type.includes('int')) {
      return 'A numeric value (whole number)';
    }
    if (type.includes('bool')) {
      return 'true or false';
    }
    if (type.includes('string')) {
      return 'Text or string value';
    }

    return 'Enter the required value for this parameter';
  };

  const handleInputChange = (index: number, value: any, type: string, paramName: string) => {
    let processedValue = value;

    // Convert based on type
    if (type === 'bool') {
      processedValue = Boolean(value);
    } else if (type.includes('uint') || type.includes('int')) {
      // Remove leading zeros for numeric inputs
      if (typeof value === 'string' && value.length > 1) {
        processedValue = value.replace(/^0+/, '') || '0';
      }
      processedValue = processedValue.toString();
    }

    // Update input values for display
    const newInputValues = [...inputValues];
    newInputValues[index] = processedValue;
    setInputValues(newInputValues);

    // Clear resolved address when user changes input
    if (type === 'address') {
      setResolvedAddresses((prev) => {
        const newAddresses = [...prev];
        newAddresses[index] = '';
        return newAddresses;
      });
    }

    // For address parameters, check if it's an ENS name and auto-resolve
    if (type === 'address' && typeof processedValue === 'string' && isEnsName(processedValue)) {
      // Auto-resolve ENS names
      resolveEnsName(processedValue, index);
      return;
    }

    // For amount/value parameters, convert to wei for the parent
    if (type === 'uint256' && (paramName.toLowerCase().includes('amount') || paramName.toLowerCase().includes('value'))) {
      if (processedValue && !Number.isNaN(Number(processedValue)) && Number(processedValue) > 0) {
        // Convert to wei: multiply by 10^18
        const weiValue = BigInt(Math.floor(Number(processedValue) * 1e18)).toString();
        onParameterChangeAction(index, weiValue);
        return;
      }
    }

    onParameterChangeAction(index, processedValue);
  };

  return (
    <div>
      <div className={`block text-sm font-medium ${COLORS.text.secondary} mb-1`}>
        Function Parameters
      </div>
      <p className={`text-xs ${COLORS.text.muted} mb-3`}>
        Enter the values for each parameter required by the selected function
      </p>
      <div className="space-y-3">
        {parameters.map((param, index) => {
          const inputType = getInputType(param.type);
          const placeholder = getPlaceholder(param.type);
          const value = displayValues[index] || '';

          return (
            <div key={`${param.name}-${param.type}`} className="flex flex-col space-y-1">
              <label className={`text-sm font-medium ${COLORS.text.primary}`}>
                {param.name}
                {' '}
                (
                {param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value'))
                  ? 'tokens'
                  : param.type}
                )
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className={`text-xs ${COLORS.text.muted}`}>
                {getParameterDescription(param.name, param.type)}
              </p>

              {inputType === 'checkbox'
                ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={e => handleInputChange(index, e.target.checked, param.type, param.name)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className={`ml-2 text-sm ${COLORS.text.muted}`}>
                        {value ? 'true' : 'false'}
                      </span>
                    </div>
                  )
                : (
                    <input
                      type={inputType}
                      value={displayValues[index] || ''}
                      onChange={e => handleInputChange(index, e.target.value, param.type, param.name)}
                      placeholder={placeholder}
                      className={`flex flex-row rounded-md ${COLORS.background.tertiary} px-4 py-2 w-full placeholder:text-gray-600`}
                    />
                  )}

              {/* ENS Resolution UI for address parameters */}
              {param.type === 'address' && (
                <div className="space-y-2">
                  {/* ENS Resolution Status */}
                  {isEnsName(value) && ensResolving[index] && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Resolving ENS name...</span>
                    </div>
                  )}

                  {/* ENS Error Messages */}
                  {ensErrors[index] && (
                    <p className="text-xs text-red-600">{ensErrors[index]}</p>
                  )}

                  {/* Address Validation */}
                  {value && !value.startsWith('0x') && value.length > 0 && !isEnsName(value) && (
                    <p className="text-xs text-red-600">Address should start with 0x or be an ENS name (.eth)</p>
                  )}

                  {value && value.startsWith('0x') && value.length !== 42 && (
                    <p className="text-xs text-red-600">Address must be 42 characters long</p>
                  )}

                  {/* Resolved Address Display */}
                  {resolvedAddresses[index] && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-start">
                        <div className="shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Resolved Address
                          </p>
                          <p className="text-xs text-green-600 mt-1 font-mono break-all">
                            {resolvedAddresses[index]}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            <a
                              href={getExplorerUrl(resolvedAddresses[index])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-green-800"
                            >
                              View on blockchain explorer →
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {param.type.includes('uint') && displayValues[index] && Number.isNaN(Number(displayValues[index])) && (
                <p className="text-xs text-red-600">Must be a valid number</p>
              )}

              {/* Token amount validation */}
              {param.type === 'uint256' && (param.name.toLowerCase().includes('amount') || param.name.toLowerCase().includes('value')) && displayValues[index] && !Number.isNaN(Number(displayValues[index])) && (
                <>
                  {Number(displayValues[index]) <= 0 && (
                    <p className="text-xs text-red-600">Amount must be greater than 0</p>
                  )}
                  {Number(displayValues[index]) > 1e9 && (
                    <p className="text-xs text-red-600">Amount seems too large (max 1 billion tokens)</p>
                  )}
                </>
              )}

              {/* Token ID validation for ERC-721 */}
              {param.type === 'uint256' && param.name.toLowerCase().includes('tokenid') && displayValues[index] && !Number.isNaN(Number(displayValues[index])) && (
                <>
                  {Number(displayValues[index]) < 0 && (
                    <p className="text-xs text-red-600">Token ID must be a positive number</p>
                  )}
                  {!Number.isInteger(Number(displayValues[index])) && (
                    <p className="text-xs text-red-600">Token ID must be a whole number</p>
                  )}
                </>
              )}

              {/* Boolean validation */}
              {param.type === 'bool' && value && value !== 'true' && value !== 'false' && (
                <p className="text-xs text-red-600">Must be true or false</p>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};
