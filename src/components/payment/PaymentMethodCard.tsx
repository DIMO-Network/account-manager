'use client';

import type Stripe from 'stripe';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WalletIcon } from '@/components/Icons';
import { BORDER_RADIUS, COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

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
  const [showConfirmSetDefault, setShowConfirmSetDefault] = useState(false);
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
      setShowConfirmSetDefault(false);
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
      <div className={`flex flex-col ${BORDER_RADIUS.xl} ${COLORS.background.primary} ${SPACING.xs} mb-4`}>
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
    <div className={`flex flex-col ${BORDER_RADIUS.lg} ${COLORS.background.primary} p-4 mb-4 relative`}>
      <div className="flex flex-col">
        {isDefault && (
          <div className="absolute -top-3 right-4 px-3 py-1 leading-6 rounded-full text-xs font-medium text-black bg-pill-gradient uppercase tracking-wider">
            Default
          </div>
        )}
        <span className="font-medium text-white">
          {formatCardBrand(card.brand)}
          {' '}
          ••••
          {card.last4}
        </span>
        <span className="text-xs text-white mt-1 leading-4.5">
          Expires
          {' '}
          {String(card.exp_month).padStart(2, '0')}
          /
          {card.exp_year}
        </span>
        {paymentMethod.billing_details?.name && (
          <span className="text-xs text-text-secondary leading-4.5">
            {paymentMethod.billing_details.name}
          </span>
        )}
        <div className="flex flex-row gap-2 mt-4">
          <button
            onClick={() => {
              router.push(`/payment-methods/edit/${paymentMethod.id}?customer_id=${customerId}`);
            }}
            disabled={isLoading}
            className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondary} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
            type="button"
          >
            Edit
          </button>
          {!isDefault && !showConfirmRemove && (
            <>
              {!showConfirmSetDefault
                ? (
                    <button
                      onClick={() => {
                        setShowConfirmSetDefault(true);
                        setShowConfirmRemove(false);
                      }}
                      disabled={isLoading}
                      className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryTransparent} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
                      type="button"
                    >
                      Set as Default
                    </button>
                  )
                : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSetDefault}
                        disabled={isLoading}
                        className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryTransparent} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowConfirmSetDefault(false)}
                        disabled={isLoading}
                        className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryTransparent} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
            </>
          )}
          {!isDefault && !showConfirmSetDefault && (
            <>
              {!showConfirmRemove
                ? (
                    <button
                      onClick={() => {
                        setShowConfirmRemove(true);
                        setShowConfirmSetDefault(false);
                      }}
                      disabled={isLoading}
                      className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryRed} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
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
                        className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryRed} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowConfirmRemove(false)}
                        disabled={isLoading}
                        className={`${RESPONSIVE.touchSmall} ${COLORS.button.secondaryRed} ${BORDER_RADIUS.full} font-medium text-xs px-4`}
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
  );
};
