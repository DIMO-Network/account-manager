import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const useCheckoutSuccess = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');
  const subscriptionId = searchParams.get('subscription_id');
  const subscriptionStatus = searchParams.get('subscription');
  const serialFromUrl = searchParams.get('serial');

  const isReturningFromSuccessfulCheckout = Boolean(
    (sessionId || subscriptionId)
    && subscriptionStatus === 'success'
    && serialFromUrl,
  );

  const hasSeenSuccessRef = useRef(isReturningFromSuccessfulCheckout);
  const persistedSerialRef = useRef<string | null>(serialFromUrl);
  const [manuallyCleared, setManuallyCleared] = useState(false);

  // Update refs if we see success
  if (isReturningFromSuccessfulCheckout) {
    hasSeenSuccessRef.current = true;
    persistedSerialRef.current = serialFromUrl;
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
      url.searchParams.delete('serial');
      router.replace(url.pathname + url.search);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isReturningFromSuccessfulCheckout, router]);

  return {
    showSuccessState: hasSeenSuccessRef.current && !manuallyCleared,
    sessionId,
    subscriptionId,
    serialFromCheckout: persistedSerialRef.current,
    clearSuccessState: () => setManuallyCleared(true),
    shouldTriggerRefresh: isReturningFromSuccessfulCheckout,
  };
};
