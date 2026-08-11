'use client';

import type { DelegationState } from '@/services/delegation/delegation-service';
import { useCallback, useEffect, useRef, useState } from 'react';
import { buildDelegateCall, isSameAddress, readDelegationState } from '@/services/delegation/delegation-service';
import { createRecoveryService } from '@/services/recovery/recovery-service';
import { SupportedChains } from '@/services/recovery/turnkey-bridge';
import { getPublicClient } from '@/services/recovery/zerodev-service';

type SessionData = {
  walletAddress?: string;
  subOrganizationId?: string;
  dimoToken?: string;
};

export type SubmitStatus
  = | { phase: 'idle' }
    | { phase: 'authorizing' }
    | { phase: 'submitting' }
    | { phase: 'confirming'; userOpHash: string }
    | { phase: 'success'; userOpHash: string; confirmed: boolean }
    | { phase: 'error'; message: string };

const CONFIRM_POLL_INTERVAL_MS = 3000;
const CONFIRM_POLL_ATTEMPTS = 10;

const wait = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

export const useDelegation = () => {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [session, setSession] = useState<SessionData | null>(null);
  const [state, setState] = useState<DelegationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submit, setSubmit] = useState<SubmitStatus>({ phase: 'idle' });
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const readState = useCallback(async (wallet: `0x${string}`): Promise<DelegationState | null> => {
    const publicClient = getPublicClient(SupportedChains.POLYGON);
    try {
      const next = await readDelegationState(publicClient, wallet);
      if (mountedRef.current) {
        setState(next);
        setError(null);
      }
      return next;
    } catch {
      if (mountedRef.current) {
        setError('Failed to load delegation state. Please try again.');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const data: SessionData = await response.json();
        if (!mountedRef.current) {
          return;
        }

        setSession(data);
        setSessionLoading(false);

        if (data.walletAddress) {
          await readState(data.walletAddress as `0x${string}`);
        } else {
          setError('Wallet address not found in your session.');
        }
      } catch {
        if (mountedRef.current) {
          setSessionLoading(false);
          setError('Failed to load your session. Please sign in again.');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    load();
  }, [readState]);

  const refetch = useCallback(async () => {
    if (!session?.walletAddress) {
      return;
    }

    setLoading(true);
    await readState(session.walletAddress as `0x${string}`);
    if (mountedRef.current) {
      setLoading(false);
    }
  }, [session, readState]);

  const delegateTo = useCallback(async (delegatee: `0x${string}`) => {
    if (inFlightRef.current) {
      return;
    }

    if (!session?.walletAddress || !session?.dimoToken || !session?.subOrganizationId) {
      setSubmit({ phase: 'error', message: 'Missing session data. Please sign out and sign in again.' });
      return;
    }

    const wallet = session.walletAddress as `0x${string}`;
    inFlightRef.current = true;

    try {
      setSubmit({ phase: 'authorizing' });

      const recoveryService = await createRecoveryService({
        dimoToken: session.dimoToken,
        subOrganizationId: session.subOrganizationId,
        walletAddress: wallet,
      });

      setSubmit({ phase: 'submitting' });

      const result = await recoveryService.executeTransaction({
        targetChain: SupportedChains.POLYGON,
        ...buildDelegateCall(delegatee),
      });

      if (!result.success || !result.transactionHash) {
        throw new Error(result.error || 'Delegation transaction failed');
      }

      const userOpHash = result.transactionHash;
      setSubmit({ phase: 'confirming', userOpHash });

      for (let attempt = 0; attempt < CONFIRM_POLL_ATTEMPTS; attempt++) {
        await wait(CONFIRM_POLL_INTERVAL_MS);

        const next = await readState(wallet);
        if (!mountedRef.current) {
          return;
        }

        if (next && isSameAddress(next.delegatee, delegatee)) {
          setSubmit({ phase: 'success', userOpHash, confirmed: true });
          return;
        }
      }

      if (mountedRef.current) {
        setSubmit({ phase: 'success', userOpHash, confirmed: false });
      }
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Delegation failed';
        setSubmit({ phase: 'error', message });
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [session, readState]);

  const resetSubmit = useCallback(() => {
    setSubmit({ phase: 'idle' });
  }, []);

  return {
    sessionLoading,
    walletAddress: (session?.walletAddress as `0x${string}` | undefined) ?? null,
    state,
    loading,
    error,
    refetch,
    submit,
    delegateTo,
    resetSubmit,
  };
};
