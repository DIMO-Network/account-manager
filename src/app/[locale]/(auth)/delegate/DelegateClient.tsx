'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DelegateIcon } from '@/components/Icons';
import { Loading } from '@/components/Loading';
import { PageHeader } from '@/components/ui';
import { useDelegation } from '@/hooks/useDelegation';
import { useStripeCustomer } from '@/hooks/useStripeCustomer';
import { getDelegationContracts, isTestnetFlow } from '@/services/delegation/constants';
import {
  formatDimoAmount,
  isSameAddress,
  isValidDelegateeAddress,
  shortenAddress,
} from '@/services/delegation/delegation-service';
import { getExplorerUrl } from '@/services/transaction-builder';
import { BORDER_RADIUS, COLORS } from '@/utils/designSystem';

type DelegateClientProps = {
  translations: {
    title: string;
    description: string;
  };
};

const { chainId, tokenSymbol } = getDelegationContracts();

export function DelegateClient({ translations }: DelegateClientProps) {
  const router = useRouter();
  const { customerId, loading: customerLoading, error: customerError } = useStripeCustomer();
  const {
    walletAddress,
    state,
    loading,
    error,
    submit,
    delegateTo,
    resetSubmit,
  } = useDelegation();

  const [addressInput, setAddressInput] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (customerLoading) {
      return;
    }

    if (customerError || !customerId) {
      router.push('/');
    }
  }, [customerId, customerLoading, customerError, router]);

  const trimmedInput = addressInput.trim();
  const inputValid = isValidDelegateeAddress(trimmedInput);
  const sameAsCurrent = Boolean(
    inputValid && state?.isDelegated && isSameAddress(trimmedInput, state.delegatee),
  );
  const sameAsWallet = Boolean(
    inputValid && walletAddress && isSameAddress(trimmedInput, walletAddress),
  );
  const busy = submit.phase === 'authorizing' || submit.phase === 'submitting' || submit.phase === 'confirming';
  const isSelfDelegated = Boolean(
    state?.isDelegated && walletAddress && isSameAddress(state.delegatee, walletAddress),
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddressInput(event.target.value);
    if (submit.phase === 'success' || submit.phase === 'error') {
      resetSubmit();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValid || sameAsCurrent || sameAsWallet || busy) {
      return;
    }

    await delegateTo(trimmedInput as `0x${string}`);
  };

  const buttonLabel = () => {
    switch (submit.phase) {
      case 'authorizing':
        return 'Waiting for passkey…';
      case 'submitting':
        return 'Submitting…';
      case 'confirming':
        return 'Confirming on-chain…';
      default:
        return state?.isDelegated ? 'Update Delegation' : 'Delegate';
    }
  };

  const renderAddress = (address: string) => (
    <>
      <span className="font-mono md:hidden">{shortenAddress(address)}</span>
      <span className="hidden font-mono md:inline">{address}</span>
    </>
  );

  const renderStatusCard = () => {
    if (loading || customerLoading) {
      return (
        <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
          <div className="flex items-center justify-center py-8">
            <Loading className="mx-auto" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (!state || !walletAddress) {
      return null;
    }

    return (
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-4`}>Your Delegation</h3>
        <div className="space-y-4">
          <div className={`${BORDER_RADIUS.lg} bg-surface-sunken p-4`}>
            <p className="text-xs text-gray-500 mb-1">
              {tokenSymbol}
              {' '}
              Balance
            </p>
            <p className={`text-xl font-semibold ${COLORS.text.primary}`}>
              {formatDimoAmount(state.balance)}
              <span className="ml-1.5 text-sm font-normal text-gray-500">{tokenSymbol}</span>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Your Wallet</p>
            <div className="flex flex-row rounded-md bg-surface-sunken px-4 py-2 w-full text-gray-400 text-sm items-center">
              {renderAddress(walletAddress)}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Currently Delegated To</p>
            <div className="flex flex-row rounded-md bg-surface-sunken px-4 py-2 w-full text-sm items-center justify-between gap-2">
              {state.isDelegated
                ? (
                    <span className={`${COLORS.text.primary} min-w-0 truncate`}>
                      {renderAddress(state.delegatee)}
                    </span>
                  )
                : (
                    <span className="text-gray-400">No delegate set</span>
                  )}
              {isSelfDelegated && (
                <span className="shrink-0 rounded-full bg-dimo-blue/10 px-2.5 py-0.5 text-xs font-medium text-dimo-blue">
                  Self
                </span>
              )}
              {!state.isDelegated && (
                <span className="shrink-0 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                  Not delegated
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFormCard = () => {
    if (loading || customerLoading || error || !state || !walletAddress) {
      return null;
    }

    return (
      <div className={`${BORDER_RADIUS.xl} ${COLORS.background.secondary} p-6`}>
        <h3 className={`text-lg font-semibold ${COLORS.text.primary} mb-4`}>
          {state.isDelegated ? 'Change Your Delegate' : 'Choose a Delegate'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="delegatee-address" className="block text-sm font-medium mb-1">
              Delegate Address
            </label>
            <input
              id="delegatee-address"
              name="delegatee-address"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="0x…"
              value={addressInput}
              onChange={handleInputChange}
              onBlur={() => setTouched(true)}
              disabled={busy}
              className="rounded-md bg-surface-sunken px-4 py-2 w-full font-mono text-sm placeholder:text-gray-600 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              The address that will vote with your
              {' '}
              {tokenSymbol}
              . You keep full control of your tokens.
            </p>
          </div>

          {touched && trimmedInput.length > 0 && !inputValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                Enter a valid Ethereum address (0x followed by 40 hex characters). The zero address is not allowed.
              </p>
            </div>
          )}

          {sameAsCurrent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Your voting power is already delegated to this address.
              </p>
            </div>
          )}

          {sameAsWallet && !sameAsCurrent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                Self-delegation is not supported — DIMO governance votes run on Snapshot, which does not count power you delegate to yourself. Choose a different delegate address.
              </p>
            </div>
          )}

          {submit.phase === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{submit.message}</p>
            </div>
          )}

          {submit.phase === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <div className="shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    {submit.confirmed
                      ? 'Delegation updated — your voting power is now active.'
                      : 'Delegation submitted — waiting for it to land on-chain. Check back in a moment.'}
                  </p>
                  <p className="text-xs text-green-600 mt-1 truncate font-mono">
                    UserOp:
                    {' '}
                    {shortenAddress(submit.userOpHash)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <a
                      href={getExplorerUrl(chainId, walletAddress, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-green-800"
                    >
                      View account activity →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {submit.phase === 'confirming' && (
            <p className="text-xs text-gray-500">
              Transaction submitted — waiting for it to land on-chain…
            </p>
          )}

          <div className="flex flex-col pt-2">
            <button
              type="submit"
              disabled={!inputValid || sameAsCurrent || sameAsWallet || busy}
              className={`${BORDER_RADIUS.full} font-medium w-full py-3 px-4 ${
                !inputValid || sameAsCurrent || sameAsWallet || busy
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              }`}
            >
              {buttonLabel()}
            </button>
            {isTestnetFlow && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Currently testing on Polygon Amoy
              </p>
            )}
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <PageHeader icon={<DelegateIcon />} title={translations.title} className="mb-0" />

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col">
          <h3 className="text-base font-medium leading-6">How This Works</h3>
          <p className="text-sm text-text-secondary font-light leading-4.5 mt-1">
            DIMO governance votes run on Snapshot. Holding
            {' '}
            {tokenSymbol}
            {' '}
            gives you no voting power until you delegate it to a delegate address. Delegating never moves or locks your tokens, and you can change your delegate at any time.
          </p>
          <p className="text-sm text-text-secondary font-light leading-4.5 mt-1">
            Staked
            {' '}
            {tokenSymbol}
            {' '}
            cannot be delegated.
          </p>
        </div>
      </div>

      {/* Not delegated / self-delegated warning */}
      {!loading && !error && state && (!state.isDelegated || isSelfDelegated) && state.balance > BigInt(0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {isSelfDelegated
              ? 'You are currently self-delegated, but Snapshot does not count self-delegated power in DIMO governance votes. Delegate to another address to activate your voting power.'
              : `Your ${tokenSymbol} currently has no voting power. Delegate it to a delegate address to activate it.`}
          </p>
        </div>
      )}

      {/* Status */}
      {renderStatusCard()}

      {/* Delegate form */}
      {renderFormCard()}
    </div>
  );
}
