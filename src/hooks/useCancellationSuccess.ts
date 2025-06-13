import { useCallback, useEffect, useState } from 'react';

type CancellationState = {
  isActive: boolean;
  serialNumber: string | null;
  timestamp: number | null;
};

export const useCancellationSuccess = (autoHideMs = 5000) => {
  const [cancellationState, setCancellationState] = useState<CancellationState>({
    isActive: false,
    serialNumber: null,
    timestamp: null,
  });

  const [isManuallyCleared, setIsManuallyCleared] = useState(false);

  useEffect(() => {
    if (!cancellationState.isActive || !cancellationState.timestamp) {
      return;
    }

    const timer = setTimeout(() => {
      setIsManuallyCleared(true);
    }, autoHideMs);

    return () => clearTimeout(timer);
  }, [cancellationState.isActive, cancellationState.timestamp, autoHideMs]);

  const showCancellationSuccess = cancellationState.isActive && !isManuallyCleared;

  const initiateCancellation = useCallback((serialNumber: string) => {
    setCancellationState({
      isActive: true,
      serialNumber,
      timestamp: Date.now(),
    });
    setIsManuallyCleared(false);
  }, []);

  const clearCancellationSuccess = useCallback(() => {
    setIsManuallyCleared(true);
  }, []);

  const resetCancellationState = useCallback(() => {
    setCancellationState({
      isActive: false,
      serialNumber: null,
      timestamp: null,
    });
    setIsManuallyCleared(false);
  }, []);

  return {
    showCancellationSuccess,
    canceledSerial: cancellationState.serialNumber,
    initiateCancellation,
    clearCancellationSuccess,
    resetCancellationState,
  };
};
