'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type SubscriptionStatusProps = {
  serialNumber: string;
  userEmail?: string;
  compact?: boolean;
};

export const DeviceSubscriptionStatus = ({
  serialNumber,
  userEmail,
  compact = false,
}: SubscriptionStatusProps) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Check if we just returned from a successful Stripe checkout
  const sessionId = searchParams.get('session_id');
  const subscriptionStatus = searchParams.get('subscription');
  const serialFromUrl = searchParams.get('serial');

  // Only show success message if this is the device that was just subscribed
  const isReturningFromCheckout = sessionId && subscriptionStatus === 'success' && serialFromUrl === serialNumber;

  // Use useCallback to memoize the function and fix dependency issues
  const checkSubscriptionStatus = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      // Add cache-busting parameter when forcing refresh
      const url = forceRefresh
        ? `/api/subscriptions/check?serial=${serialNumber}&refresh=${Date.now()}`
        : `/api/subscriptions/check?serial=${serialNumber}`;

      const response = await fetch(url);
      const data = await response.json();
      setSubscriptionData(data);
    } catch (fetchError) {
      console.error('Error checking subscription:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to check subscription');
    } finally {
      setLoading(false);
    }
  }, [serialNumber]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus, sessionId]);

  useEffect(() => {
    if (!isReturningFromCheckout) {
      return;
    }

    const timeout = setTimeout(() => {
      checkSubscriptionStatus();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isReturningFromCheckout, checkSubscriptionStatus]);

  const activateSubscription = async () => {
    if (!userEmail) {
      setError('User email is required to activate subscription');
      return;
    }

    setActivating(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber,
          userEmail,
          priceId: 'price_1RUVNj4dLDxx1E1eF1HR4mRZ',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (fetchError) {
      console.error('Error creating checkout session:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to create checkout session');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className={compact ? 'text-xs text-gray-500' : 'p-4 border rounded-lg'}>
        {!compact && <h3 className="text-lg font-semibold">Device Subscription</h3>}
        <p>Checking subscription status...</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Subscription Status</h4>

        {/* Show any errors */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-800">
              Error:
              {error}
            </span>
          </div>
        )}

        {subscriptionData?.hasActiveSubscription
          ? (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-800 font-medium">Active</span>
                  {subscriptionData.subscription?.planType && (
                    <span className="text-green-700 ml-1">
                      (
                      {subscriptionData.subscription.planType}
                      )
                    </span>
                  )}
                </div>
                <button
                  onClick={() => checkSubscriptionStatus(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                  type="button"
                  title="Refresh status"
                >
                  ↻
                </button>
              </div>
            )
          : (
              <div className="space-y-2">
                <div className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-yellow-800 font-medium">No Active Subscription</span>
                </div>
                <button
                  onClick={activateSubscription}
                  disabled={activating}
                  className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded transition-colors"
                  type="button"
                >
                  {activating ? 'Processing...' : 'Activate Subscription'}
                </button>
              </div>
            )}

        {subscriptionData?.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-800">
              Error:
              {' '}
              {subscriptionData.error}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Device Subscription</h3>

      {/* Show any errors */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <span className="text-red-800">
            Error:
            {error}
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <span className="font-medium">Serial Number:</span>
          {' '}
          {serialNumber}
        </div>

        {subscriptionData?.hasActiveSubscription
          ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-800 font-medium">Active Subscription</span>
                    </div>
                    {subscriptionData.subscription && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Status:
                          {subscriptionData.subscription.status}
                        </p>
                        <p>
                          Plan:
                          {subscriptionData.subscription.planType || 'Basic'}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => checkSubscriptionStatus(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    type="button"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
            )
          : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-yellow-800 font-medium">No Active Subscription</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Activate a subscription to unlock premium features for your R1 device.
                    </p>
                  </div>
                  <button
                    onClick={activateSubscription}
                    disabled={activating}
                    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded transition-colors"
                    type="button"
                  >
                    {activating ? 'Processing...' : 'Activate Subscription'}
                  </button>
                </div>
              </div>
            )}

        {subscriptionData?.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <span className="text-red-800">
              Error:
              {subscriptionData.error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
