'use client';

import { useState } from 'react';
import { RESPONSIVE } from '@/utils/designSystem';

type TransactionsSDKTopUpProps = {
  amount: number;
  onSuccessAction: () => void;
  onErrorAction: (error: unknown) => void;
};

export const TransactionsSDKTopUp = ({ amount: _amount, onSuccessAction: _onSuccess, onErrorAction }: TransactionsSDKTopUpProps) => {
  const [loading, setLoading] = useState(false);

  // const _TOKEN_CONTRACT = featureFlags.useOmidToken
  //   ? '0x21cFE003997fB7c2B3cfe5cf71e7833B7B2eCe10' // OMID (Polygon Amoy)
  //   : '0xE261D618a959aFfFd53168Cd07D12E37B26761db'; // DIMO (Polygon Mainnet)

  // const _RECIPIENT = '0xCec224A21bdF3Bd2d5E95aC38A92523146b814Bd';

  // function _toWei(amount: number): string {
  //   // Convert to wei (18 decimals)
  //   const weiAmount = BigInt(Math.floor(amount * 1e18));
  //   return weiAmount.toString();
  // }

  const handleTopUp = async () => {
    setLoading(true);
    try {
      // TODO: Implement DIMO Transactions SDK approach
      // This will need to be implemented similar to dimo-driver's approach
      // using KernelSigner and the transactions SDK

      console.warn('Transactions SDK approach not yet implemented');
      onErrorAction(new Error('Transactions SDK approach not yet implemented'));
    } catch (error) {
      onErrorAction(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTopUp}
      disabled={loading}
      className={`${RESPONSIVE.touch} px-4 py-2 text-sm bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Processing...' : 'Add Credits'}
    </button>
  );
};
