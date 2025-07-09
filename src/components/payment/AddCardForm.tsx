'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { FormField } from '@/components/FormField';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { BORDER_RADIUS, COLORS, SPACING } from '@/utils/designSystem';

type AddCardFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const AddCardForm = ({ onSuccess, onCancel }: AddCardFormProps) => {
  const { customerId } = useStripeCustomer();
  const { fetchPaymentMethods } = usePaymentMethods(customerId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    address_city: '',
    address_country: '',
    address_line1: '',
    address_line2: '',
    address_state: '',
    address_zip: '',
  });

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!publishableKey) {
        setError('Stripe configuration is missing. Please check your environment variables.');
        return;
      }

      const stripeInstance = await loadStripe(publishableKey);
      setStripe(stripeInstance);

      if (stripeInstance) {
        const elementsInstance = stripeInstance.elements();

        const card = elementsInstance.create('card', {
          style: {
            base: {
              'fontSize': '16px',
              'color': '#ffffff',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        });

        card.mount('#card-element');
        setCardElement(card);
      }
    };

    initStripe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!customerId || !stripe || !cardElement) {
        throw new Error('Required dependencies not loaded');
      }

      // Create payment method using Stripe Elements
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: form.name,
          address: {
            city: form.address_city,
            country: form.address_country,
            line1: form.address_line1,
            line2: form.address_line2,
            state: form.address_state,
            postal_code: form.address_zip,
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Attach the payment method to the customer
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          paymentMethodId: paymentMethod.id,
          billing_details: {
            name: form.name,
            address: {
              city: form.address_city,
              country: form.address_country,
              line1: form.address_line1,
              line2: form.address_line2,
              state: form.address_state,
              postal_code: form.address_zip,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add card');
      }

      setSuccess(true);
      await fetchPaymentMethods();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`${SPACING.md} text-center border border-green-500 rounded-lg ${COLORS.background.secondary}`}>
        <div className="text-green-500 text-4xl mb-3">✅</div>
        <h3 className="text-green-500 font-semibold mb-2">Card Added Successfully!</h3>
        <p className="text-grey-400 text-sm">Your new payment method has been added.</p>
      </div>
    );
  }

  return (
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.md}`}>
      <h2 className="text-lg font-semibold mb-4">Add a New Card</h2>

      {error && (
        <div className={`${SPACING.sm} mb-4 ${COLORS.background.secondary} border border-feedback-error rounded-lg`}>
          <p className="text-feedback-error text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Cardholder Name"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          required
        />

        <div>
          <label htmlFor="card-element" className="block text-sm font-medium mb-1">
            Card Details
          </label>
          <div className="rounded-md bg-surface-raised px-4 py-2 w-full" id="card-element" />
        </div>

        <FormField
          label="Address Line 1"
          id="address_line1"
          name="address_line1"
          value={form.address_line1}
          onChange={handleChange}
          placeholder="123 Main St"
        />

        <FormField
          label="Address Line 2"
          id="address_line2"
          name="address_line2"
          value={form.address_line2}
          onChange={handleChange}
          placeholder="Apt 4B"
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <FormField
              label="City"
              id="address_city"
              name="address_city"
              value={form.address_city}
              onChange={handleChange}
              placeholder="New York"
            />
          </div>
          <div className="flex-1">
            <FormField
              label="State"
              id="address_state"
              name="address_state"
              value={form.address_state}
              onChange={handleChange}
              placeholder="NY"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <FormField
              label="ZIP Code"
              id="address_zip"
              name="address_zip"
              value={form.address_zip}
              onChange={handleChange}
              placeholder="10001"
            />
          </div>
          <div className="flex-1">
            <FormField
              label="Country"
              id="address_country"
              name="address_country"
              value={form.address_country}
              onChange={handleChange}
              placeholder="US"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !stripe}
            className="flex-1 bg-white text-black py-2 px-4 rounded-full font-medium disabled:opacity-50"
          >
            {loading ? 'Adding Card...' : 'Add Card'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-full font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
