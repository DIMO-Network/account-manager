'use client';

import type { NetworkConfig } from '@/services/transaction-builder';
import { useState } from 'react';
import { getContractAddresses } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type ContractSelectorProps = {
  value: string;
  onChangeAction: (address: string) => void;
  networkConfig: NetworkConfig | null;
  selectedAction?: string;
  networkId?: string;
};

export const ContractSelector = ({ value, onChangeAction, networkConfig, selectedAction, networkId }: ContractSelectorProps) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Get default contract addresses for the selected action and network
  const getDefaultContracts = () => {
    if (!selectedAction || !networkId) {
      return [];
    }

    // Map action IDs to token types
    const actionToTokenType: Record<string, string> = {
      'erc20-transfer': 'erc20',
      'erc721-transfer': 'erc721',
    };

    const tokenType = actionToTokenType[selectedAction];
    if (!tokenType) {
      return [];
    }

    // Get contract addresses for the specific token type and network
    return getContractAddresses(tokenType, networkId);
  };

  const defaultContracts = getDefaultContracts();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    onChangeAction(address);

    if (address === '') {
      setIsValid(null);
    } else {
      setIsValid(validateAddress(address));
    }
  };

  const getExplorerUrl = (address: string): string => {
    if (!networkConfig || !validateAddress(address)) {
      return '#';
    }
    return `${networkConfig.explorerUrl}/address/${address}`;
  };

  return (
    <div>
      <label htmlFor="contract-address" className={`block text-sm font-medium ${COLORS.text.secondary} mb-1`}>
        Token/Contract Address
      </label>
      <p className={`text-xs ${COLORS.text.muted} mb-2`}>
        Enter the contract address of the ERC-20 token or ERC-721 NFT you want to recover
      </p>

      {/* Default contract options for ERC-20 */}
      {defaultContracts.length > 0 && (
        <div className="mb-4">
          <p className={`text-xs ${COLORS.text.muted} mb-2`}>
            Quick select common tokens:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {defaultContracts.map((contract) => {
              const isSelected = value === contract.address;
              return (
                <button
                  key={contract.address}
                  type="button"
                  onClick={() => {
                    onChangeAction(contract.address);
                    setIsValid(true);
                  }}
                  className={`flex flex-col p-3 text-left ${BORDER_RADIUS.lg} border ${COLORS.background.tertiary} transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-white'
                      : 'border-transparent hover:border-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${COLORS.text.primary}`}>{contract.name}</div>
                      <div className={`text-xs ${COLORS.text.muted} font-mono break-all`}>{contract.address}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-text-secondary">
            Or enter a custom contract address below
          </div>
        </div>
      )}

      <div className="relative">
        <input
          id="contract-address"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="0x..."
          className={`flex flex-row rounded-md ${COLORS.background.tertiary} px-4 py-2 w-full placeholder:text-gray-600 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isValid === false
              ? 'border-red-300 focus:ring-red-500'
              : COLORS.border.default
          }`}
        />
      </div>

      {isValid === false && value && (
        <p className="mt-1 text-sm text-red-600">Invalid contract address format</p>
      )}

      {(isValid === true && value) || (value && defaultContracts.some(contract => contract.address === value))
        ? (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Valid contract address entered
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <a
                      href={getExplorerUrl(value)}
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
          )
        : null}
    </div>
  );
};
