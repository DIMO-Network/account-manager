'use client';

import { useState } from 'react';
import { DefaultPaymentMethodCard } from '@/components/payment/DefaultPaymentMethodCard';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';

// Simple component to show a non-default payment method
function NonDefaultPaymentMethodCard({ paymentMethod }: { paymentMethod: any }) {
  const [showConfirmSetDefault, setShowConfirmSetDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { customerId } = useStripeCustomer();
  const { fetchPaymentMethods } = usePaymentMethods(customerId);

  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return null;
  }
  const card = paymentMethod.card;
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
    if (!isLoading && customerId) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            customerId,
            action: 'set_default',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set default payment method');
        }

        // Refresh the payment methods to get updated default
        await fetchPaymentMethods();
        setShowConfirmSetDefault(false);
      } catch (error) {
        console.error('Error setting default payment method:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col">
      <span className="font-medium text-white">
        {formatCardBrand(card.brand)}
        {' '}
        ••••
        {card.last4}
      </span>
      <span className="text-xs mt-1 leading-4.5">
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
        {!showConfirmSetDefault
          ? (
              <button
                onClick={() => setShowConfirmSetDefault(true)}
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
      </div>
    </div>
  );
}

export function PaymentMethodClient() {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const { paymentMethods, defaultPaymentMethodId, loading, error } = usePaymentMethods(customerId);

  if (customerLoading || loading || !paymentMethods) {
    return (
      <div className="flex flex-col space-y-2">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-5 rounded w-3/4`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-3 rounded w-1/2`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-3 rounded w-2/3`}></div>
      </div>
    );
  }

  if (customerError || error) {
    return <div className="text-feedback-error text-sm">Error loading payment method</div>;
  }

  const defaultPaymentMethod = paymentMethods.find(pm => pm.id === defaultPaymentMethodId);

  if (paymentMethods.length === 0) {
    return (
      <div className="flex flex-col">
        <h3 className="text-base font-medium leading-6">No payment method found</h3>
      </div>
    );
  }

  // If there's a default payment method, show it
  if (defaultPaymentMethod) {
    return <DefaultPaymentMethodCard paymentMethod={defaultPaymentMethod} />;
  }

  // If there are payment methods but no default, show the first one with a note
  return <NonDefaultPaymentMethodCard paymentMethod={paymentMethods[0]} />;
}
