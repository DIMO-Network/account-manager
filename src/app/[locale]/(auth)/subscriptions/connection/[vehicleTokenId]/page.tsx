import { notFound, redirect } from 'next/navigation';
import { ConnectionSubscriptionDetailCard } from '@/components/subscriptions/ConnectionSubscriptionDetailCard';
import { getSession } from '@/libs/Session';

export default async function ConnectionSubscriptionPage({
  params,
}: {
  params: Promise<{ vehicleTokenId: string }>;
}) {
  const { vehicleTokenId } = await params;

  // Check authentication
  const session = await getSession();
  if (!session?.dimoToken) {
    redirect('/auth/signin');
  }

  try {
    // Fetch subscription data for this vehicle
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/subscription/vehicle/${vehicleTokenId}`, {
      headers: {
        Authorization: `Bearer ${session.dimoToken}`,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      if (response.status === 403) {
        redirect('/dashboard');
      }
      throw new Error(`Failed to fetch subscription: ${response.status}`);
    }

    const subscription = await response.json();

    // Check if user owns this subscription
    if (!subscription || !subscription.device?.vehicle?.tokenId) {
      redirect('/dashboard');
    }

    return <ConnectionSubscriptionDetailCard subscription={subscription} />;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    redirect('/dashboard');
  }
}
