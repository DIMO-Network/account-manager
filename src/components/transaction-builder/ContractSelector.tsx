'use client';

import type { NetworkConfig } from '@/services/transaction-builder';
import { useState } from 'react';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type ContractSelectorProps = {
  value: string;
  onChangeAction: (address: string) => void;
  networkConfig: NetworkConfig | null;
};

export const ContractSelector = ({ value, onChangeAction, networkConfig }: ContractSelectorProps) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

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
      <div className="relative">
        <input
          id="contract-address"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="0x..."
          className={`w-full px-4 py-2 ${BORDER_RADIUS.md} ${COLORS.background.tertiary} ${COLORS.text.primary} border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isValid === false
              ? 'border-red-300 focus:ring-red-500'
              : isValid === true
                ? 'border-green-300 focus:ring-green-500'
                : COLORS.border.default
          }`}
        />
        {isValid === true && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {isValid === false && value && (
        <p className="mt-1 text-sm text-red-600">Invalid contract address format</p>
      )}

      {isValid === true && value && (
        <div className="mt-2 flex items-center gap-2">
          <a
            href={getExplorerUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View on
            {' '}
            {networkConfig?.name}
            {' '}
            Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};
