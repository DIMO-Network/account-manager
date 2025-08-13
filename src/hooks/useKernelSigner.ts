'use client';

import { KernelSigner } from '@dimo-network/transactions';
import { useCallback, useEffect, useState } from 'react';
import { kernelSignerConfig } from '@/libs/TransactionsConfig';

let kernelSignerInstance: KernelSigner | null = null;

export const useKernelSigner = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  // Initialize KernelSigner
  const initializeKernelSigner = useCallback(() => {
    try {
      if (!kernelSignerInstance) {
        kernelSignerInstance = new KernelSigner(kernelSignerConfig);
      }
      setIsInitialized(true);
      setError(null);
      return kernelSignerInstance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize KernelSigner';
      setError(errorMessage);
      console.error('KernelSigner initialization error:', err);
      return null;
    }
  }, []);

  // Get KernelSigner instance with session check
  const getKernelSigner = useCallback(async () => {
    if (!kernelSignerInstance) {
      return initializeKernelSigner();
    }

    // Check if we have an active session
    if (!kernelSignerInstance.hasActiveSession()) {
      setError('No active session. Please authenticate with DIMO first.');
      setHasSession(false);
      return null;
    }

    setHasSession(true);
    setError(null);
    return kernelSignerInstance;
  }, [initializeKernelSigner]);

  // Get active client with proper error handling
  const getActiveClient = useCallback(async () => {
    const kernelSigner = await getKernelSigner();
    if (!kernelSigner) {
      throw new Error('KernelSigner not available');
    }

    if (!kernelSigner.hasActiveSession()) {
      throw new Error('No active session. Please authenticate with DIMO first.');
    }

    const client = await kernelSigner.getActiveClient();
    if (!client) {
      throw new Error('Failed to get active client');
    }

    return client;
  }, [getKernelSigner]);

  // Reset KernelSigner
  const resetKernelSigner = useCallback(() => {
    if (kernelSignerInstance) {
      kernelSignerInstance.resetClient();
      kernelSignerInstance = null;
    }
    setIsInitialized(false);
    setError(null);
    setHasSession(false);
  }, []);

  // Initialize on mount using useCallback
  const initializeOnMount = useCallback(() => {
    if (!isInitialized && !error) {
      initializeKernelSigner();
    }
  }, [isInitialized, error, initializeKernelSigner]);

  // Use useEffect to call the callback
  useEffect(() => {
    initializeOnMount();
  }, [initializeOnMount]);

  return {
    kernelSigner: kernelSignerInstance,
    getKernelSigner,
    getActiveClient,
    initializeKernelSigner,
    resetKernelSigner,
    isInitialized,
    hasSession,
    error,
  };
};
