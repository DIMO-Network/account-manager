'use client';

import { useEffect, useState } from 'react';
import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';
import { featureFlags } from '@/utils/FeatureFlags';

type TopUpReviewProps = {
  amount: number;
  onBackAction: () => void;
  onSuccessAction: () => void;
};

export const TopUpReview = ({ amount, onBackAction, onSuccessAction }: TopUpReviewProps) => {
  const [loading, setLoading] = useState(false);
  const [dimoPrice, setDimoPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);

  const TOKEN_SYMBOL = featureFlags.useOmidToken ? 'OMID' : 'DIMO';
  const TRANSFER_FEE = 0.5;

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

  const handleSubmit = async () => {
    setLoading(true);

    // TODO: Implement top-up logic
    console.warn('Top-up functionality not implemented');

    setLoading(false);
    onSuccessAction();
  };

  return (
    <div className="space-y-6">
      {/* Transaction Breakdown */}
      <div className={`${SPACING.lg} border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-4`}>
          Transaction Details
        </h3>

        <div className="space-y-4">
          <div className="space-y-3">
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
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Credits you'll receive</span>
              <span className="text-sm font-medium text-white">
                {netCredits.toFixed(2)}
                {' '}
                {TOKEN_SYMBOL}
              </span>
            </div>
            {priceLoading
              ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">USD value</span>
                    <div className="animate-pulse bg-gray-600 h-4 w-20 rounded"></div>
                  </div>
                )
              : dimoPrice && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">USD value</span>
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1`}
            >
              {loading ? 'Processing...' : 'Add Credits'}
            </button>
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
