export type DelegationContracts = {
  chainId: number;
  dimoToken: `0x${string}`;
  tokenSymbol: string;
};

export const isTestnetFlow = process.env.NEXT_PUBLIC_RECOVERY_FLOW === 'testnet';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// DIMO governance lives on Polygon. Amoy uses the OMID test token.
export const getDelegationContracts = (): DelegationContracts =>
  isTestnetFlow
    ? {
        chainId: 80002,
        dimoToken: '0x21cFE003997fB7c2B3cfe5cf71e7833B7B2eCe10',
        tokenSymbol: 'OMID',
      }
    : {
        chainId: 137,
        dimoToken: '0xE261D618a959aFfFd53168Cd07D12E37B26761db',
        tokenSymbol: 'DIMO',
      };
