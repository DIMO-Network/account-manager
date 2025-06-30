'use client';

import type Stripe from 'stripe';
import { useState } from 'react';

type PaymentMethodCardProps = {
  paymentMethod: Stripe.PaymentMethod;
  isDefault: boolean;
  onSetDefaultAction: (paymentMethodId: string) => Promise<void>;
  onRemoveAction: (paymentMethodId: string) => Promise<void>;
  isLoading: boolean;
};

export const PaymentMethodCard = ({
  paymentMethod,
  isDefault,
  onSetDefaultAction,
  onRemoveAction,
  isLoading,
}: PaymentMethodCardProps) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

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

  const canRemove = !isDefault; // Can't remove default payment method

  // Handle different payment method types
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return (
      <div className="border rounded-lg p-4">
        <div className="text-gray-600">
          Unsupported payment method type:
          {' '}
          {paymentMethod.type}
        </div>
      </div>
    );
  }

  const card = paymentMethod.card;

  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getBrandIcon(card.brand)}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {formatCardBrand(card.brand)}
                {' '}
                ••••
                {card.last4}
              </span>
              {isDefault && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  Default
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Expires
              {' '}
              {String(card.exp_month).padStart(2, '0')}
              /
              {card.exp_year}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {card.funding}
              {' '}
              card
              {card.country && ` • ${card.country}`}
            </div>
            {paymentMethod.billing_details?.name && (
              <div className="text-xs text-gray-500">
                {paymentMethod.billing_details.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isDefault && (
            <button
              onClick={handleSetDefault}
              disabled={isLoading}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
              type="button"
            >
              Set as Default
            </button>
          )}

          {canRemove && (
            <>
              {!showConfirmRemove
                ? (
                    <button
                      onClick={() => setShowConfirmRemove(true)}
                      disabled={isLoading}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        type="button"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowConfirmRemove(false)}
                        disabled={isLoading}
                        className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
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

      <div className="text-xs text-gray-500 mt-2">
        Added
        {' '}
        {new Date(paymentMethod.created * 1000).toLocaleDateString()}
      </div>

      {/* Show additional card details if available */}
      {card.checks && (
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          {card.checks.cvc_check && (
            <span className={`px-2 py-1 rounded ${
              card.checks.cvc_check === 'pass' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
            >
              CVC:
              {' '}
              {card.checks.cvc_check}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
