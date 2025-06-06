'use client';

import type Stripe from 'stripe';
import type { PaymentMethodsResponse } from '@/types/paymentMethod';
import { useCallback, useEffect, useState } from 'react';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
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
        <div className="animate-pulse bg-gray-200 h-8 rounded w-1/3"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
      </div>
    );
  }

  // Show customer error
  if (customerError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-semibold">Error setting up payment methods</h3>
            <p className="text-red-600 text-sm mt-1">{customerError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching payment methods
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-semibold">Error loading payment methods</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPaymentMethods}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
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
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Unable to load payment methods. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-400 text-4xl mb-3">💳</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods found</h3>
        <p className="text-gray-600 text-sm mb-4">
          You haven't added any payment methods yet. Add one when you create your first subscription.
        </p>
        <button
          onClick={fetchPaymentMethods}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
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
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Customer ID:</strong>
          {' '}
          {customerId}
        </p>
      </div>

      {/* Card Payment Methods */}
      {cardPaymentMethods.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Cards (
              {cardPaymentMethods.length}
              )
            </h3>
            <button
              onClick={fetchPaymentMethods}
              disabled={actionLoading}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
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
          <h3 className="text-lg font-medium text-gray-900">
            Other Payment Methods (
            {otherPaymentMethods.length}
            )
          </h3>
          <div className="space-y-3">
            {otherPaymentMethods.map(paymentMethod => (
              <div key={paymentMethod.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="text-gray-600">
                  {paymentMethod.type}
                  {' '}
                  payment method (ID:
                  {paymentMethod.id}
                  )
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Added
                  {' '}
                  {new Date(paymentMethod.created * 1000).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
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
