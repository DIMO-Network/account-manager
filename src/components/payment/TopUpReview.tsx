'use client';

import { ExecuteAdvancedTransactionWithDimo } from '@dimo-network/login-with-dimo';
import { useEffect, useState } from 'react';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

import { getCurrentTokenConfig, SHARED_CONFIG } from '@/utils/TokenConfig';

type TopUpReviewProps = {
  amount: number;
  onBackAction: () => void;
  onSuccessAction: () => void;
};

export const TopUpReview = ({ amount, onBackAction, onSuccessAction }: TopUpReviewProps) => {
  const [dimoPrice, setDimoPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  const TOKEN_SYMBOL = getCurrentTokenConfig().symbol;
  const TRANSFER_FEE = SHARED_CONFIG.transferFee;

  // Fetch price on component mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setPriceLoading(true);
        const priceResponse = await fetch('/api/dimo-price');

        if (!priceResponse.ok) {
          throw new Error('Failed to fetch token price');
        }

        const priceData = await priceResponse.json();
        setDimoPrice(Number(priceData.price));
      } catch (err) {
        console.error('Failed to load token price:', err);
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrice();
  }, []);

  // Calculate review values
  const transferAmount = amount;
  const transferFee = TRANSFER_FEE;
  const totalCost = transferAmount + transferFee;
  const netCredits = transferAmount; // Amount that becomes credits
  const netCreditsUsd = netCredits * (dimoPrice || 0);

  const ERC20_TRANSFER_ABI = [
    {
      inputs: [
        { internalType: 'address', name: 'to', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  const TOKEN_CONTRACT = getCurrentTokenConfig().contract;
  const RECIPIENT = SHARED_CONFIG.recipient;

  function toWei(amount: number): string {
    // Convert to wei (18 decimals)
    const weiAmount = BigInt(Math.floor(amount * 1e18));
    return weiAmount.toString();
  }

  return (
    <div className="space-y-6">
      {/* Transaction Breakdown */}
      <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} px-4 py-3`}>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary}`}>
          Transaction Details
        </h3>

        <div className="flex flex-col gap-4 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Amount to convert</span>
              <span className="text-sm font-medium text-white">
                {transferAmount.toFixed(2)}
                {' '}
                {TOKEN_SYMBOL}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Transfer fee</span>
              <span className="text-sm font-medium text-white">
                {transferFee.toFixed(2)}
                {' '}
                {TOKEN_SYMBOL}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-700 pt-3">
              <span className="text-sm text-gray-400">Total cost</span>
              <span className="text-sm font-medium text-white">
                {totalCost.toFixed(2)}
                {' '}
                {TOKEN_SYMBOL}
              </span>
            </div>
            {priceLoading
              ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Credits you'll receive</span>
                    <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
                  </div>
                )
              : dimoPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Credits you'll receive</span>
                  <span className="text-sm font-medium text-white">
                    ≈ $
                    {netCreditsUsd.toFixed(2)}
                    {' '}
                    USD
                  </span>
                </div>
              )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Time estimate</span>
              <span className="text-sm font-medium text-white">~2-5 minutes</span>
            </div>
          </div>

          <div className="flex gap-3 mt">
            <ExecuteAdvancedTransactionWithDimo
              mode="redirect"
              onSuccess={() => {
                // Transaction hash will come through URL params in redirect mode
                onSuccessAction();
              }}
              onError={(error: unknown) => {
                console.error('Error:', error);
              }}
              address={TOKEN_CONTRACT}
              value="0"
              abi={ERC20_TRANSFER_ABI}
              functionName="transfer"
              args={[RECIPIENT, toWei(totalCost)]}
              authenticatedLabel="Add Credits"
              unAuthenticatedLabel="Add Credits"
            />
            <button
              type="button"
              onClick={onBackAction}
              className={`${RESPONSIVE.touch} px-4 py-2 text-sm text-grey-400 hover:text-white transition-colors`}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
