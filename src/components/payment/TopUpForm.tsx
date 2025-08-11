'use client';

import { useCallback, useRef, useState } from 'react';
import { FormField } from '@/components/FormField';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { getCurrentTokenConfig, SHARED_CONFIG } from '@/utils/TokenConfig';

type TopUpFormProps = {
  onReviewAction: (amount: number, usdValue: number) => void;
  onCancelAction: () => void;
  initialAmount?: number;
  initialUsdValue?: number;
  tokenBalance: number | null;
  dimoPrice: number | null;
  balanceLoading: boolean;
  priceLoading: boolean;
};

export const TopUpForm = ({
  onReviewAction,
  onCancelAction,
  initialAmount,
  initialUsdValue,
  tokenBalance,
  dimoPrice,
  balanceLoading,
  priceLoading,
}: TopUpFormProps) => {
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [inputUsdValue, setInputUsdValue] = useState<number | null>(initialUsdValue || null);
  const [inputUsdLoading, setInputUsdLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const TOKEN_SYMBOL = getCurrentTokenConfig().symbol;
  const TRANSFER_FEE = SHARED_CONFIG.transferFee;

  // Debounced function to calculate USD value
  const debouncedCalculateUsd = useCallback((amount: string, price: number | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (amount && price && !Number.isNaN(Number(amount))) {
        // Calculate USD value for the full amount
        setInputUsdValue(Number(amount) * price);
        setInputUsdLoading(false);
      } else {
        setInputUsdValue(null);
        setInputUsdLoading(false);
      }
    }, 500); // 500ms delay
  }, []);

  const validateAmount = (value: string): string | null => {
    if (!value) {
      return 'Amount is required';
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }

    if (tokenBalance !== null && (numValue + TRANSFER_FEE) > tokenBalance) {
      return 'Insufficient token balance';
    }

    if (numValue < SHARED_CONFIG.minAmount) {
      return `Minimum amount is ${SHARED_CONFIG.minAmount} tokens`;
    }

    return null;
  };

  const setAmountToMax = () => {
    if (tokenBalance !== null) {
      // Set to available balance
      const maxAmount = Math.max(0, tokenBalance - TRANSFER_FEE);
      const maxAmountString = maxAmount.toFixed(2);
      setAmount(maxAmountString);
      setAmountError(null);

      // Trigger USD calculation for the max amount
      if (dimoPrice) {
        setInputUsdLoading(true);
        debouncedCalculateUsd(maxAmountString, dimoPrice);
      }
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const error = validateAmount(value);
    setAmountError(error);

    // Trigger USD calculation with loading state
    if (value && dimoPrice) {
      setInputUsdLoading(true);
      debouncedCalculateUsd(value, dimoPrice);
    } else {
      setInputUsdValue(null);
      setInputUsdLoading(false);
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    onReviewAction(Number(amount), inputUsdValue || 0);
  };

  return (
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} px-4 py-3`}>
      <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary}`}>
        Add Credits with
        {' '}
        {TOKEN_SYMBOL}
      </h3>

      <form onSubmit={handleReview} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="amount" className="block text-sm font-medium text-white">
              Amount to convert (
              {TOKEN_SYMBOL}
              )
            </label>
            <button
              type="button"
              onClick={setAmountToMax}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            {`There will be a ${SHARED_CONFIG.transferFee} ${TOKEN_SYMBOL} conversion fee`}
          </p>
          <div className="relative">
            <FormField
              label=""
              id="amount"
              name="amount"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0"
              type="number"
              required
              className={`${amountError ? 'border-red-500' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {TOKEN_SYMBOL}
            </div>
          </div>
          {amountError && (
            <p className="text-red-400 text-xs mt-1">{amountError}</p>
          )}
          {!amountError && (
            <div className="mt-1">
              <div className="text-xs text-gray-400 h-3">
                {balanceLoading
                  ? (
                      <div className="animate-pulse bg-gray-600 h-3 w-32 rounded"></div>
                    )
                  : tokenBalance !== null
                    ? (
                        <>
                          Available:
                          {' '}
                          {tokenBalance.toFixed(2)}
                          {' '}
                          {TOKEN_SYMBOL}
                        </>
                      )
                    : null}
              </div>
              {amount && (
                <div className="text-xs text-gray-400 h-3 mt-1">
                  {(inputUsdLoading || priceLoading)
                    ? (
                        <div className="animate-pulse bg-gray-600 h-3 w-16 rounded"></div>
                      )
                    : inputUsdValue !== null
                      ? (
                          `≈ $${inputUsdValue.toFixed(2)} USD`
                        )
                      : null}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!amount}
            className={`${RESPONSIVE.touch} px-4 py-2 text-sm ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Review
          </button>
          <button
            type="button"
            onClick={onCancelAction}
            className={`${RESPONSIVE.touch} px-4 py-2 text-sm text-grey-400`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
