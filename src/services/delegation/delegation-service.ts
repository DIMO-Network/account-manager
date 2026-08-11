import { encodeFunctionData, formatUnits } from 'viem';
import { DIMO_VOTES_ABI } from './abi';
import { getDelegationContracts, ZERO_ADDRESS } from './constants';

export type DelegationState = {
  delegatee: `0x${string}`;
  isDelegated: boolean;
  balance: bigint;
};

export type DelegationReadClient = {
  readContract: (args: {
    address: `0x${string}`;
    abi: typeof DIMO_VOTES_ABI;
    functionName: 'delegates' | 'balanceOf';
    args: readonly [`0x${string}`];
  }) => Promise<unknown>;
};

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const isValidDelegateeAddress = (input: string): boolean =>
  ADDRESS_REGEX.test(input) && input.toLowerCase() !== ZERO_ADDRESS;

export const isSameAddress = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

export const encodeDelegateCallData = (delegatee: `0x${string}`): `0x${string}` =>
  encodeFunctionData({
    abi: DIMO_VOTES_ABI,
    functionName: 'delegate',
    args: [delegatee],
  });

export const buildDelegateCall = (delegatee: `0x${string}`) => ({
  contractAddress: getDelegationContracts().dimoToken,
  abi: DIMO_VOTES_ABI as unknown as any[],
  functionName: 'delegate',
  parameters: [delegatee],
});

export const readDelegationState = async (
  client: DelegationReadClient,
  wallet: `0x${string}`,
): Promise<DelegationState> => {
  const { dimoToken } = getDelegationContracts();

  const [delegatee, balance] = await Promise.all([
    client.readContract({ address: dimoToken, abi: DIMO_VOTES_ABI, functionName: 'delegates', args: [wallet] }),
    client.readContract({ address: dimoToken, abi: DIMO_VOTES_ABI, functionName: 'balanceOf', args: [wallet] }),
  ]);

  return {
    delegatee: delegatee as `0x${string}`,
    isDelegated: !isSameAddress(delegatee as string, ZERO_ADDRESS),
    balance: balance as bigint,
  };
};

export const formatDimoAmount = (wei: bigint): string => {
  const formatted = formatUnits(wei, 18);
  const [whole = '0', fraction = ''] = formatted.split('.');
  const trimmedFraction = fraction.replace(/0+$/, '').slice(0, 4);
  const withSeparators = Number(whole) >= 1000
    ? Number(whole).toLocaleString('en-US')
    : whole;
  return trimmedFraction ? `${withSeparators}.${trimmedFraction}` : withSeparators;
};

export const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
