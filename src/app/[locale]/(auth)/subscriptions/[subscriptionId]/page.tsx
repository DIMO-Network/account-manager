'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SubscriptionDetailCard from '@/components/subscription/SubscriptionDetailCard';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = params?.subscriptionId as string;
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscriptionId) {
      return;
    }

    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setSubscription(data);
        }
      } catch {
        setError('Failed to fetch subscription details');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [subscriptionId]);

  return (
    <div className="py-5">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {subscription && <SubscriptionDetailCard subscription={subscription} />}
    </div>
  );
}
