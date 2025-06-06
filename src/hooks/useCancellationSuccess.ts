import { useCallback, useEffect, useRef, useState } from 'react';

export const useCancellationSuccess = () => {
  const cancellationInitiatedRef = useRef(false);
  const cancellationSerialRef = useRef<string | null>(null);
  const [manuallyCleared, setManuallyCleared] = useState(false);

  const showCancellationSuccess = cancellationInitiatedRef.current
    && !manuallyCleared;

  useEffect(() => {
    if (!showCancellationSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      setManuallyCleared(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showCancellationSuccess]);

  const initiateCancellation = useCallback((serialNumber: string) => {
    cancellationInitiatedRef.current = true;
    cancellationSerialRef.current = serialNumber;
    setManuallyCleared(false);
  }, []);

  const clearCancellationSuccess = useCallback(() => {
    setManuallyCleared(true);
  }, []);

  const resetCancellationState = useCallback(() => {
    cancellationInitiatedRef.current = false;
    cancellationSerialRef.current = null;
    setManuallyCleared(false);
  }, []);

  return {
    showCancellationSuccess,
    canceledSerial: cancellationSerialRef.current,
    initiateCancellation,
    clearCancellationSuccess,
    resetCancellationState,
  };
};
