'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditCardPage() {
  const router = useRouter();
  const { cardId } = useParams();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id');
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
      setTimeout(() => router.push(`/payment-methods`), 1500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!card) {
    return <div className="p-8 text-center">Card not found.</div>;
  }

  return (
    <div className="bg-surface-default rounded-lg p-4">
      <h1 className="text-xl font-bold mb-4">Edit Card</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Cardholder Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
        </div>
        <div className="flex gap-2 mb-1">
          <div className="flex-1">
            <label htmlFor="exp_month" className="block text-sm font-medium mb-1">Exp Month</label>
            <input id="exp_month" name="exp_month" value={form.exp_month} readOnly className="flex flex-row rounded-md px-4 py-2 bg-surface-sunken cursor-not-allowed w-full text-gray-700" />
          </div>
          <div className="flex-1">
            <label htmlFor="exp_year" className="block text-sm font-medium mb-1">Exp Year</label>
            <input id="exp_year" name="exp_year" value={form.exp_year} readOnly className="flex flex-row rounded-md px-4 py-2 bg-surface-sunken cursor-not-allowed w-full text-gray-700" />
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-4">Expiration cannot be updated. To change expiration, add a new card.</div>
        <div>
          <label htmlFor="address_line1" className="block text-sm font-medium mb-1">Address Line 1</label>
          <input id="address_line1" name="address_line1" value={form.address_line1} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
        </div>
        <div>
          <label htmlFor="address_line2" className="block text-sm font-medium mb-1">Address Line 2</label>
          <input id="address_line2" name="address_line2" value={form.address_line2} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="address_city" className="block text-sm font-medium mb-1">City</label>
            <input id="address_city" name="address_city" value={form.address_city} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
          </div>
          <div className="flex-1">
            <label htmlFor="address_state" className="block text-sm font-medium mb-1">State</label>
            <input id="address_state" name="address_state" value={form.address_state} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="address_zip" className="block text-sm font-medium mb-1">ZIP</label>
            <input id="address_zip" name="address_zip" value={form.address_zip} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
          </div>
          <div className="flex-1">
            <label htmlFor="address_country" className="block text-sm font-medium mb-1">Country</label>
            <input id="address_country" name="address_country" value={form.address_country} onChange={handleChange} className="flex flex-row rounded-md bg-surface-raised px-4 py-2 w-full" />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-white text-black py-2 rounded-full font-medium mt-4 disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
        {success && <div className="text-green-600 text-center mt-2">Card updated!</div>}
      </form>
    </div>
  );
}
