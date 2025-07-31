'use client';

import { useEffect, useState } from 'react';
import { FormField } from '@/components/FormField';
import { FormSkeleton } from '@/components/payment/FormSkeleton';
import { CountryDropdown } from '@/components/ui';
import { BORDER_RADIUS, COLORS, RESPONSIVE, SPACING } from '@/utils/designSystem';

type EditCardFormProps = {
  cardId: string;
  customerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const EditCardForm = ({ cardId, customerId, onSuccess, onCancel }: EditCardFormProps) => {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    exp_month: '',
    exp_year: '',
    address_city: '',
    address_country: '',
    address_line1: '',
    address_line2: '',
    address_state: '',
    address_zip: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchCard() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/payment-methods?cardId=${cardId}&customer_id=${customerId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch card');
        }
        setCard(data.card);
        setForm({
          name: data.card.billing_details?.name || '',
          exp_month: data.card.card?.exp_month?.toString() || '',
          exp_year: data.card.card?.exp_year?.toString() || '',
          address_city: data.card.billing_details?.address?.city || '',
          address_country: data.card.billing_details?.address?.country || '',
          address_line1: data.card.billing_details?.address?.line1 || '',
          address_line2: data.card.billing_details?.address?.line2 || '',
          address_state: data.card.billing_details?.address?.state || '',
          address_zip: data.card.billing_details?.address?.postal_code || '',
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    if (cardId && customerId) {
      fetchCard();
    }
  }, [cardId, customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (!card) {
        throw new Error('Card not loaded');
      }
      const res = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          ...form,
          customerId: card.customer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update card');
      }
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FormSkeleton fieldCount={5} showButtons={true} />;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!card) {
    return <div className="p-8 text-center">Card not found.</div>;
  }

  if (success) {
    return (
      <div className={`${SPACING.md} text-center border border-green-500 rounded-lg ${COLORS.background.secondary}`}>
        <div className="text-green-500 text-4xl mb-3">✅</div>
        <h3 className="text-green-500 font-semibold mb-2">Card Updated Successfully!</h3>
        <p className="text-grey-400 text-sm">Your payment method has been updated.</p>
      </div>
    );
  }

  return (
    <div className={`${BORDER_RADIUS.lg} ${COLORS.background.primary} ${SPACING.md}`}>
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
          placeholder="First Last"
        />
        <div className="flex gap-2 mb-1">
          <div className="flex-1">
            <FormField
              label="Exp Month"
              id="exp_month"
              name="exp_month"
              value={form.exp_month}
              readOnly
            />
          </div>
          <div className="flex-1">
            <FormField
              label="Exp Year"
              id="exp_year"
              name="exp_year"
              value={form.exp_year}
              readOnly
            />
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-4">Expiration cannot be updated. To change expiration, add a new card.</div>
        <FormField
          label="Address Line 1"
          id="address_line1"
          name="address_line1"
          value={form.address_line1}
          onChange={handleChange}
          placeholder="Street address, P.O. Box, company name, c/o"
        />
        <FormField
          label="Address Line 2"
          id="address_line2"
          name="address_line2"
          value={form.address_line2}
          onChange={handleChange}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <FormField
              label="City"
              id="address_city"
              name="address_city"
              value={form.address_city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>
          <div className="flex-1">
            <FormField
              label="State"
              id="address_state"
              name="address_state"
              value={form.address_state}
              onChange={handleChange}
              placeholder="State"
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
              placeholder="Zip Code"
            />
          </div>
          <div className="flex-1">
            <CountryDropdown
              value={form.address_country}
              onChangeAction={value => setForm(f => ({ ...f, address_country: value }))}
            />
          </div>
        </div>
        <div className="flex flex-col pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${COLORS.button.primary}`}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className={`${RESPONSIVE.touch} ${BORDER_RADIUS.full} font-medium w-full ${COLORS.button.tertiary}`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
