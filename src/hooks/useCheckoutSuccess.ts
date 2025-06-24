import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const useCheckoutSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');
  const subscriptionId = searchParams.get('subscription_id');
  const subscriptionStatus = searchParams.get('subscription');
  const connectionIdFromUrl = searchParams.get('connection_id');

  const isReturningFromSuccessfulCheckout = Boolean(
    (sessionId || subscriptionId)
    && subscriptionStatus === 'success'
    && connectionIdFromUrl,
  );

  const hasSeenSuccessRef = useRef(isReturningFromSuccessfulCheckout);
  const persistedConnectionIdRef = useRef<string | null>(connectionIdFromUrl);
  const [manuallyCleared, setManuallyCleared] = useState(false);

  // Update refs if we see success
  if (isReturningFromSuccessfulCheckout) {
    hasSeenSuccessRef.current = true;
    persistedConnectionIdRef.current = connectionIdFromUrl;
  }

  // Clear URL params after delay
  useEffect(() => {
    if (!isReturningFromSuccessfulCheckout) {
      return;
    }

    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      url.searchParams.delete('subscription_id');
      url.searchParams.delete('subscription');
      url.searchParams.delete('connection_id');
      router.replace(url.pathname + url.search);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isReturningFromSuccessfulCheckout, router]);

  return {
    showSuccessState: hasSeenSuccessRef.current && !manuallyCleared,
    sessionId,
    subscriptionId,
    connectionIdFromCheckout: persistedConnectionIdRef.current,
    clearSuccessState: () => setManuallyCleared(true),
    shouldTriggerRefresh: isReturningFromSuccessfulCheckout,
  };
};
