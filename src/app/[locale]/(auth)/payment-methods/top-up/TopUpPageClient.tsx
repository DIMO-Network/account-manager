'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WalletIcon } from '@/components/Icons';
import { TopUpForm } from '@/components/payment/TopUpForm';
import { TopUpReview } from '@/components/payment/TopUpReview';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';
import { getCurrentTokenConfig } from '@/utils/TokenConfig';

type Step = 'form' | 'review';

export function TopUpPageClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [amount, setAmount] = useState<number>(0);
  const [usdValue, setUsdValue] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [dimoPrice, setDimoPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  const TOKEN_SYMBOL = getCurrentTokenConfig().symbol;

  // Extract fetch logic into a reusable function
  const fetchData = async () => {
    // Fetch token balance
    try {
      setBalanceLoading(true);
      setPriceLoading(true);
      setBalanceError(null);
      setPriceError(null);

      const balanceResponse = await fetch('/api/dimo-balance');

      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch token balance');
      }

      const balanceData = await balanceResponse.json();
      setTokenBalance(balanceData.balance);
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : 'Failed to load token balance');
    } finally {
      setBalanceLoading(false);
    }

    // Fetch token price (same for both tokens)
    try {
      const priceResponse = await fetch('/api/dimo-price');

      if (!priceResponse.ok) {
        throw new Error('Failed to fetch token price');
      }

      const priceData = await priceResponse.json();
      setDimoPrice(Number(priceData.price));
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Failed to load token price');
    } finally {
      setPriceLoading(false);
    }
  };

  // Fetch token balance and price on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewAction = (reviewAmount: number, reviewUsdValue: number) => {
    setAmount(reviewAmount);
    setUsdValue(reviewUsdValue);
    setCurrentStep('review');
  };

  const handleCancelAction = () => {
    router.push('/payment-methods');
  };

  const handleBackToForm = () => {
    setCurrentStep('form'); // Refresh data when going back to form to get latest balance and price
    fetchData();
  };

  const handleSuccess = () => {
    // TODO: Handle success - maybe redirect to payment methods or show success message?
    router.push('/payment-methods');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center gap-2 border-b border-gray-700 pb-2">
        <WalletIcon className={`w-4 h-4 ${COLORS.text.secondary}`} />
        <h1 className={`text-base font-medium leading-6 ${COLORS.text.secondary}`}>Top Up Credits</h1>
      </div>

      {/* Token Balance Card */}
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} px-4 py-3`}>
        <div className="flex flex-col">
          <span className="font-medium text-white">
            Your
            {' '}
            {TOKEN_SYMBOL}
            {' '}
            Balance
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            {balanceLoading
              ? (
                  <div className="animate-pulse bg-gray-600 h-8 rounded w-24"></div>
                )
              : balanceError
                ? (
                    <span className="text-red-400">Error loading balance</span>
                  )
                : (
                    `${tokenBalance?.toFixed(2) || 0} ${TOKEN_SYMBOL}`
                  )}
          </div>
          {priceLoading
            ? (
                <div className="animate-pulse bg-gray-600 h-3 rounded w-32 mt-1"></div>
              )
            : priceError
              ? (
                  <div className="text-xs text-text-secondary mt-1">Error loading price</div>
                )
              : tokenBalance !== null && dimoPrice !== null
                ? (
                    <div className="text-xs text-text-secondary leading-4.5 mt-1">
                      ≈ $
                      {(tokenBalance * dimoPrice).toFixed(2)}
                      {' '}
                      USD
                    </div>
                  )
                : null}
          <span className="text-xs text-text-secondary leading-4.5 mt-1">
            Add credits to your account using your
            {' '}
            {TOKEN_SYMBOL}
            {' '}
            balance
          </span>
        </div>
      </div>

      {/* Form or Review */}
      {currentStep === 'form'
        ? (
            <TopUpForm
              onReviewAction={handleReviewAction}
              onCancelAction={handleCancelAction}
              initialAmount={amount}
              initialUsdValue={usdValue}
              tokenBalance={tokenBalance}
              dimoPrice={dimoPrice}
              balanceLoading={balanceLoading}
              priceLoading={priceLoading}
            />
          )
        : (
            <TopUpReview
              amount={amount}
              onBackAction={handleBackToForm}
              onSuccessAction={handleSuccess}
            />
          )}
    </div>
  );
}
