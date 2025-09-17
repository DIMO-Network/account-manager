'use client';

import type Stripe from 'stripe';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WalletIcon } from '@/components/Icons';
import { PaymentMethodsListClient } from '@/components/payment/PaymentMethodsListClient';
import { PageHeader } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE } from '@/utils/designSystem';
import { PaymentMethodSkeleton } from './PaymentMethodSkeleton';

type PaymentMethodsWrapperProps = {
  initialCustomerId?: string;
  initialPaymentMethods?: Stripe.PaymentMethod[];
  initialDefaultPaymentMethodId?: string;
};

const EMPTY_PAYMENT_METHODS: Stripe.PaymentMethod[] = [];

export function PaymentMethodsWrapper({
  initialCustomerId,
  initialPaymentMethods = EMPTY_PAYMENT_METHODS,
  initialDefaultPaymentMethodId,
}: PaymentMethodsWrapperProps) {
  const [customerId, setCustomerId] = useState<string | null>(initialCustomerId || null);
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>(initialPaymentMethods);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(initialDefaultPaymentMethodId || null);
  const [loading, setLoading] = useState(!initialCustomerId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      return; // Already have customer ID, no need to fetch
    }

    const fetchCustomerId = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stripe/customer');

        if (!response.ok) {
          throw new Error('Failed to get Stripe customer');
        }

        const data = await response.json();
        setCustomerId(data.customerId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerId();
  }, [initialCustomerId]);

  // Fetch payment methods when customer ID is available
  useEffect(() => {
    if (!customerId || initialPaymentMethods.length > 0) {
      return; // Already have payment methods or no customer ID
    }

    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch(`/api/payment-methods?customer_id=${customerId}`);

        if (!response.ok) {
          throw new Error('Failed to get payment methods');
        }

        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
        setDefaultPaymentMethodId(data.defaultPaymentMethodId || null);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        // Don't set error state for payment methods, just log it
      }
    };

    fetchPaymentMethods();
  }, [customerId, initialPaymentMethods.length]);

  if (loading) {
    return (
      <PaymentMethodSkeleton count={2} showNote={true} />
    );
  }

  if (error || !customerId) {
    return (
      <div className="flex flex-col">
        <PageHeader
          icon={<WalletIcon />}
          title="Payment Method"
          className="mb-6"
        >
          <Link
            href="/payment-methods/add"
            className={`${RESPONSIVE.touchSmall} px-4 py-2 text-sm ${COLORS.background.secondary} ${BORDER_RADIUS.full}`}
          >
            Add a Card
          </Link>
        </PageHeader>
        <div className="text-center py-8">
          <p className="text-gray-500">
            {error || 'Unable to load payment methods'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PaymentMethodsListClient
      paymentMethods={paymentMethods}
      defaultPaymentMethodId={defaultPaymentMethodId}
      customerId={customerId}
    />
  );
}
