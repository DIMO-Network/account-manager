'use client';

import type Stripe from 'stripe';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { useCallback, useEffect, useState } from 'react';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';
import { PaymentMethodCard } from './PaymentMethodCard';

export const PaymentMethodsList = () => {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!customerId) {
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/payment-methods?customer_id=${customerId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment methods');
      }

      const data: PaymentMethodsResponse = await response.json();
      setPaymentMethods(data.paymentMethods);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId || null);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchPaymentMethods();
    }
  }, [fetchPaymentMethods, customerId]);

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!customerId) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, customerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }

      setDefaultPaymentMethodId(paymentMethodId);
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove payment method');
      }

      // Remove from local state
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));

      // If this was the default, clear default
      if (defaultPaymentMethodId === paymentMethodId) {
        setDefaultPaymentMethodId(null);
      }
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove payment method');
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading state while getting customer
  if (customerLoading) {
    return (
      <div className="space-y-4">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-8 rounded w-1/3`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
      </div>
    );
  }

  // Show customer error
  if (customerError) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-semibold">Error setting up payment methods</h3>
            <p className="text-grey-400 text-sm mt-1">{customerError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching payment methods
  if (loading) {
    return (
      <div className="space-y-4">
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
        <div className={`animate-pulse ${COLORS.background.tertiary} h-24 rounded-lg`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-feedback-error font-semibold">Error loading payment methods</h3>
            <p className="text-grey-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPaymentMethods}
            className={`${RESPONSIVE.touch} px-3 py-1 text-sm text-feedback-error hover:text-feedback-error hover:bg-surface-sunken rounded transition-colors`}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className={`${SPACING.md} ${COLORS.background.secondary} border border-yellow-500 rounded-lg`}>
        <p className="text-yellow-500">
          Unable to load payment methods. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className={`${SPACING.lg} text-center border ${COLORS.border.default} rounded-lg ${COLORS.background.secondary}`}>
        <div className="text-grey-400 text-4xl mb-3">💳</div>
        <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary} mb-2`}>No payment methods found</h3>
        <p className={`${RESPONSIVE.text.body} text-grey-400 mb-4`}>
          You haven't added any payment methods yet. Add one when you create your first subscription.
        </p>
        <button
          onClick={fetchPaymentMethods}
          className={`${RESPONSIVE.touch} px-4 py-2 text-sm text-primary-500 hover:text-primary-600 hover:bg-surface-sunken rounded transition-colors`}
          type="button"
        >
          Refresh
        </button>
      </div>
    );
  }

  // Group payment methods by type (though we're only showing cards for now)
  const cardPaymentMethods = paymentMethods.filter(pm => pm.type === 'card');
  const otherPaymentMethods = paymentMethods.filter(pm => pm.type !== 'card');

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className={`${SPACING.sm} ${COLORS.background.secondary} border border-primary-500 rounded-lg`}>
        <p className={`${RESPONSIVE.text.body} text-primary-500`}>
          <strong>Customer ID:</strong>
          {' '}
          {customerId}
        </p>
      </div>

      {/* Card Payment Methods */}
      {cardPaymentMethods.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary}`}>
              Cards (
              {cardPaymentMethods.length}
              )
            </h3>
            <button
              onClick={fetchPaymentMethods}
              disabled={actionLoading}
              className={`${RESPONSIVE.touch} px-3 py-1 text-sm text-grey-400 hover:text-grey-300 hover:bg-surface-sunken rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              type="button"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="space-y-3">
            {cardPaymentMethods.map(paymentMethod => (
              <PaymentMethodCard
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                isDefault={defaultPaymentMethodId === paymentMethod.id}
                onSetDefaultAction={handleSetDefault}
                onRemoveAction={handleRemove}
                isLoading={actionLoading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Payment Methods (for future expansion) */}
      {otherPaymentMethods.length > 0 && (
        <div className="space-y-4">
          <h3 className={`${RESPONSIVE.text.h3} font-medium ${COLORS.text.primary}`}>
            Other Payment Methods (
            {otherPaymentMethods.length}
            )
          </h3>
          <div className="space-y-3">
            {otherPaymentMethods.map(paymentMethod => (
              <div key={paymentMethod.id} className={`border ${COLORS.border.default} rounded-lg ${SPACING.md} ${COLORS.background.secondary}`}>
                <div className="text-grey-400">
                  {paymentMethod.type}
                  {' '}
                  payment method (ID:
                  {paymentMethod.id}
                  )
                </div>
                <div className="text-xs text-grey-500 mt-1">
                  Added
                  {' '}
                  {new Date(paymentMethod.created * 1000).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${SPACING.sm} ${COLORS.background.secondary} border border-primary-500 rounded-lg`}>
        <p className={`${RESPONSIVE.text.body} text-primary-500`}>
          💡
          {' '}
          <strong>Tip:</strong>
          {' '}
          Payment methods are automatically saved when you create subscriptions.
          Your default payment method will be used for automatic renewals.
        </p>
      </div>
    </div>
  );
};
