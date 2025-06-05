import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type UseCheckoutPollingProps = {
  serialNumber: string;
  subscriptionData: any;
  checkStatus: (forceRefresh?: boolean) => Promise<void>;
};

export const useCheckoutPolling = ({
  serialNumber,
  subscriptionData,
  checkStatus,
}: UseCheckoutPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const searchParams = useSearchParams();

  const sessionId = searchParams.get('session_id');
  const subscriptionStatus = searchParams.get('subscription');
  const serialFromUrl = searchParams.get('serial');

  const isReturningFromCheckout = sessionId
    && subscriptionStatus === 'success'
    && serialFromUrl === serialNumber;

  const handlePollingComplete = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isReturningFromCheckout) {
      return;
    }

    let pollCount = 0;
    const maxPolls = 24; // 24 * 5 seconds = 2 minutes
    let pollInterval: NodeJS.Timeout;

    const startPollingProcess = async () => {
      setIsPolling(true);

      // Check immediately
      await checkStatus(true);

      pollInterval = setInterval(async () => {
        pollCount++;
        await checkStatus(true);

        // Stop polling if subscription found or max polls reached
        if (subscriptionData?.hasActiveSubscription || pollCount >= maxPolls) {
          clearInterval(pollInterval);
          handlePollingComplete();
        }
      }, 5000);
    };

    startPollingProcess();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      handlePollingComplete();
    };
  }, [isReturningFromCheckout, checkStatus, subscriptionData?.hasActiveSubscription, serialNumber, handlePollingComplete]);

  return { isPolling };
};
