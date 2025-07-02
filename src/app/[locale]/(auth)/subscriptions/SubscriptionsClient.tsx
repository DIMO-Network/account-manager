'use client';

import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { useStripeSubscriptions } from '@/hooks/useStripeSubscriptions';

export function SubscriptionsClient() {
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const { subscriptions, loading, error } = useStripeSubscriptions(customerId);

  if (customerLoading || loading) {
    return <div>Loading...</div>;
  }
  if (customerError || error) {
    return (
      <div>
        Error:
        {customerError || error}
      </div>
    );
  }

  let content;
  if (subscriptions.length === 0) {
    content = <p>No subscriptions found.</p>;
  } else {
    content = (
      <ul className="space-y-4">
        {subscriptions.map(sub => (
          <li key={sub.id} className="border rounded p-4">
            <div>
              <strong>ID:</strong>
              {' '}
              {sub.id}
            </div>
            <div>
              <strong>Status:</strong>
              {' '}
              {sub.status}
            </div>
            <div>
              <strong>Start Date:</strong>
              {' '}
              {sub.start_date ? new Date(sub.start_date * 1000).toLocaleDateString() : 'N/A'}
            </div>
            {/* Add more details as needed */}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="py-5 [&_p]:my-6">
      <h1 className="text-2xl font-bold mb-4">Subscriptions</h1>
      {content}
    </div>
  );
}
