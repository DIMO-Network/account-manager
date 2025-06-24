import { useCallback, useEffect, useState } from 'react';

type CancellationState = {
  isActive: boolean;
  connectionId: string | null;
  timestamp: number | null;
};

export const useCancellationSuccess = (autoHideMs = 5000) => {
  const [cancellationState, setCancellationState] = useState<CancellationState>({
    isActive: false,
    connectionId: null,
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

  const initiateCancellation = useCallback((connectionId: string) => {
    setCancellationState({
      isActive: true,
      connectionId,
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
      connectionId: null,
      timestamp: null,
    });
    setIsManuallyCleared(false);
  }, []);

  return {
    showCancellationSuccess,
    canceledConnectionId: cancellationState.connectionId,
    initiateCancellation,
    clearCancellationSuccess,
    resetCancellationState,
  };
};
