'use client';

import type Stripe from 'stripe';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WalletIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, SPACING } from '@/utils/designSystem';

type PaymentMethodCardProps = {
  paymentMethod: Stripe.PaymentMethod;
  isDefault: boolean;
  onSetDefaultAction: (paymentMethodId: string) => Promise<void>;
  onRemoveAction: (paymentMethodId: string) => Promise<void>;
  isLoading: boolean;
  customerId: string;
};

export const PaymentMethodCard = ({
  paymentMethod,
  isDefault,
  onSetDefaultAction,
  onRemoveAction,
  isLoading,
  customerId,
}: PaymentMethodCardProps) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const router = useRouter();

  const formatCardBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'amex':
        return 'American Express';
      case 'mastercard':
        return 'Mastercard';
      case 'visa':
        return 'Visa';
      case 'discover':
        return 'Discover';
      case 'diners':
        return 'Diners Club';
      case 'jcb':
        return 'JCB';
      case 'unionpay':
        return 'Union Pay';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  };

  const handleSetDefault = async () => {
    if (!isDefault && !isLoading) {
      await onSetDefaultAction(paymentMethod.id);
    }
  };

  const handleRemove = async () => {
    if (!isLoading) {
      await onRemoveAction(paymentMethod.id);
      setShowConfirmRemove(false);
    }
  };

  // Handle different payment method types
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return (
      <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} mb-4`}>
        <div className="mb-4">
          <WalletIcon className="w-4 h-4" />
        </div>
        <div className="text-gray-600">
          Unsupported payment method type:
          {paymentMethod.type}
        </div>
      </div>
    );
  }

  const card = paymentMethod.card;

  return (
    <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.xs} mb-4 relative`}>
      <div className="flex flex-col mt-4">
        {isDefault && (
          <div className="absolute -top-2 right-6 px-2 py-1 rounded-full text-xs font-medium text-black bg-pill-gradient">
            Default
          </div>
        )}
        <span className="font-medium text-white">
          {formatCardBrand(card.brand)}
          {' '}
          ••••
          {card.last4}
        </span>
        <span className="text-xs text-grey-400 mt-1">
          Expires
          {' '}
          {String(card.exp_month).padStart(2, '0')}
          /
          {card.exp_year}
        </span>
        {paymentMethod.billing_details?.name && (
          <span className="text-xs text-grey-500">
            {paymentMethod.billing_details.name}
          </span>
        )}
        <div className="flex flex-row gap-2 mt-6">
          <button
            onClick={() => {
              router.push(`/payment-methods/edit/${paymentMethod.id}?customer_id=${customerId}`);
            }}
            disabled={isLoading}
            className="w-full max-w-40 gap-2 rounded-full bg-white px-4 font-medium h-10 text-black disabled:opacity-50"
            type="button"
          >
            Edit
          </button>
          <div className="flex-1 flex justify-end gap-2">
            {!isDefault && (
              <button
                onClick={handleSetDefault}
                disabled={isLoading}
                className="px-4 font-medium h-10 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                type="button"
              >
                Set as Default
              </button>
            )}
            {!isDefault && (
              <>
                {!showConfirmRemove
                  ? (
                      <button
                        onClick={() => setShowConfirmRemove(true)}
                        disabled={isLoading}
                        className="px-4 font-medium h-10 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        type="button"
                      >
                        Remove
                      </button>
                    )
                  : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleRemove}
                          disabled={isLoading}
                          className="px-2 h-10 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
                          type="button"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowConfirmRemove(false)}
                          disabled={isLoading}
                          className="px-2 h-10 text-xs bg-gray-300 rounded-full hover:bg-gray-400"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
