'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BORDER_RADIUS, COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

type TopUpFormProps = {
  onSuccessAction: () => void;
  onCancelAction: () => void;
};

export const TopUpForm = ({ onSuccessAction, onCancelAction }: TopUpFormProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [dimoBalance, setDimoBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isAmountFieldFocused, setIsAmountFieldFocused] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dimoPrice, setDimoPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [inputUsdValue, setInputUsdValue] = useState<number | null>(null);
  const [inputUsdLoading, setInputUsdLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced function to calculate USD value
  const debouncedCalculateUsd = useCallback((amount: string, price: number | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (amount && price && !Number.isNaN(Number(amount))) {
        // Calculate USD value for the net amount (transfer amount minus gas fee)
        const netAmount = Math.max(0, Number(amount) - 0.1);
        setInputUsdValue(netAmount * price);
        setInputUsdLoading(false);
      } else {
        setInputUsdValue(null);
        setInputUsdLoading(false);
      }
    }, 500); // 500ms delay
  }, []);

  // Fetch DIMO balance and price on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch DIMO balance
      try {
        setBalanceLoading(true);
        setBalanceError(null);

        const balanceResponse = await fetch('/api/dimo-balance');

        if (!balanceResponse.ok) {
          throw new Error('Failed to fetch DIMO balance');
        }

        const balanceData = await balanceResponse.json();
        setDimoBalance(balanceData.balance);
      } catch (err) {
        setBalanceError(err instanceof Error ? err.message : 'Failed to load DIMO balance');
      } finally {
        setBalanceLoading(false);
      }

      // Fetch DIMO price
      try {
        setPriceLoading(true);
        setPriceError(null);

        const priceResponse = await fetch('/api/dimo-price');

        if (!priceResponse.ok) {
          throw new Error('Failed to fetch DIMO price');
        }

        const priceData = await priceResponse.json();
        setDimoPrice(Number(priceData.price));
      } catch (err) {
        setPriceError(err instanceof Error ? err.message : 'Failed to load DIMO price');
      } finally {
        setPriceLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateAmount = (value: string): string | null => {
    if (!value) {
      return 'Amount is required';
    }

    const numValue = Number(value);
    if (Number.isNaN(numValue) || numValue <= 0) {
      return 'Please enter a valid amount';
    }

    if (dimoBalance !== null && (numValue + 0.1) > dimoBalance) {
      return 'Insufficient DIMO balance';
    }

    if (numValue < 0.5) {
      return 'Minimum amount is 0.5 DIMO';
    }

    return null;
  };

  const setAmountToMax = () => {
    if (dimoBalance !== null) {
      // Set to available balance minus gas fee (0.1 DIMO)
      const maxAmount = Math.max(0, dimoBalance - 0.1);
      const maxAmountString = maxAmount.toFixed(6);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateAmount(amount);
    if (error) {
      setAmountError(error);
      return;
    }

    setLoading(true);

    // TODO: Implement top-up logic
    console.warn('Top-up functionality not implemented');

    setLoading(false);
    onSuccessAction();
  };

  return (
    <div className="space-y-6">
      {/* DIMO Balance Card */}
      <div className={`${SPACING.lg} border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-2`}>Your $DIMO Balance</h3>
        <p className={`${RESPONSIVE.text.body} text-grey-400 mb-4`}>
          Add credits to your account using your $DIMO balance
        </p>
        <div className="text-2xl font-bold text-white">
          {balanceLoading
            ? (
                <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
              )
            : balanceError
              ? (
                  <span className="text-red-400">Error loading balance</span>
                )
              : (
                  `${dimoBalance?.toFixed(2) || '0.00'} DIMO`
                )}
        </div>
        {priceLoading
          ? (
              <div className="animate-pulse bg-gray-600 h-4 w-20 rounded mt-1"></div>
            )
          : priceError
            ? (
                <div className="text-xs text-red-400 mt-1">Error loading price</div>
              )
            : dimoBalance !== null && dimoPrice !== null
              ? (
                  <div className="text-sm text-gray-400 mt-1">
                    ≈ $
                    {(dimoBalance * dimoPrice).toFixed(2)}
                    {' '}
                    USD
                  </div>
                )
              : null}
      </div>

      {/* Add Credits Form */}
      <div className={`${SPACING.lg} border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-4`}>Add Credits with $DIMO</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="amount" className="block text-sm font-medium text-white">
                Amount to convert ($DIMO)
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
              Includes a 0.1 DIMO gas and buffer fee. USD conversion shows net credits you'll receive.
            </p>
            <div className={`relative border rounded ${BORDER_RADIUS.md} ${
              amountError
                ? 'border-red-500'
                : isAmountFieldFocused
                  ? 'border-white'
                  : 'border-gray-700'
            }`}
            >
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                onFocus={() => setIsAmountFieldFocused(true)}
                onBlur={() => setIsAmountFieldFocused(false)}
                placeholder="0"
                step="0.000001"
                min="0"
                className="w-full px-3 py-2 bg-white text-black rounded-l focus:outline-none"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                DIMO
              </div>
            </div>
            {amountError && (
              <p className="text-red-400 text-xs mt-1">{amountError}</p>
            )}
            {dimoBalance !== null && !amountError && (
              <div className="mt-1">
                <p className="text-gray-400 text-xs">
                  Available:
                  {' '}
                  {dimoBalance.toFixed(6)}
                  {' '}
                  DIMO
                </p>
                {amount && dimoPrice && (
                  <div className="text-xs text-gray-400 mt-1">
                    {inputUsdLoading
                      ? (
                          <div className="animate-pulse bg-gray-600 h-3 w-16 rounded"></div>
                        )
                      : inputUsdValue !== null
                        ? (
                            `≈ $${inputUsdValue.toFixed(2)} USD in credits`
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
              disabled={loading || !amount}
              className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : 'Add Credits'}
            </button>
            <button
              type="button"
              onClick={onCancelAction}
              className={`${RESPONSIVE.touch} px-4 py-2 text-sm text-grey-400 hover:text-white transition-colors`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
