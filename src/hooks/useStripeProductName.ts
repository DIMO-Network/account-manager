import { useEffect, useRef, useState } from 'react';

export const useStripeProductName = (subscriptionId: string | null) => {
  const [productName, setProductName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSubscriptionId = useRef<string | null>(null);

  useEffect(() => {
    const fetchProductName = async () => {
      if (!subscriptionId) {
        setProductName(null);
        setLoading(false);
        setError(null);
        lastSubscriptionId.current = null;
        return;
      }

      // Prevent duplicate requests for the same subscriptionId
      if (lastSubscriptionId.current === subscriptionId) {
        return;
      }

      lastSubscriptionId.current = subscriptionId;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/subscriptions/${subscriptionId}/product-name`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProductName(data.productName);
      } catch (err) {
        console.error('Error fetching product name:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product name');
        setProductName(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductName();
  }, [subscriptionId]);

  return { productName, loading, error };
};
