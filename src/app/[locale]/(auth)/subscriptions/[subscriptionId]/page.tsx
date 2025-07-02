'use client';
import { useParams } from 'next/navigation';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = params?.subscriptionId as string;
  return (
    <div className="py-5">
      <h1 className="text-2xl font-bold mb-4">Subscription Detail</h1>
      <p>
        Subscription ID:
        {subscriptionId}
      </p>
      {/* TODO: Fetch and display more details about this subscription */}
    </div>
  );
}
