import { describe, expect, it, vi } from 'vitest';
import { getDelegationContracts, ZERO_ADDRESS } from './constants';
import {
  buildDelegateCall,
  encodeDelegateCallData,
  formatDimoAmount,
  isSameAddress,
  isValidDelegateeAddress,
  readDelegationState,
  shortenAddress,
} from './delegation-service';

const WALLET = '0x1234567890AbcdEF1234567890aBcdef12345678' as const;
const DELEGATEE = '0xE261D618a959aFfFd53168Cd07D12E37B26761db' as const;

describe('isValidDelegateeAddress', () => {
  it('accepts a lowercase address', () => {
    expect(isValidDelegateeAddress('0xe261d618a959afffd53168cd07d12e37b26761db')).toBe(true);
  });

  it('accepts a checksummed address', () => {
    expect(isValidDelegateeAddress(DELEGATEE)).toBe(true);
  });

  it('rejects a short address', () => {
    expect(isValidDelegateeAddress('0xe261d618')).toBe(false);
  });

  it('rejects a missing 0x prefix', () => {
    expect(isValidDelegateeAddress('e261d618a959afffd53168cd07d12e37b26761db00')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidDelegateeAddress('0xZ261d618a959afffd53168cd07d12e37b26761db')).toBe(false);
  });

  it('rejects whitespace-padded input', () => {
    expect(isValidDelegateeAddress(` ${DELEGATEE} `)).toBe(false);
  });

  it('rejects the zero address', () => {
    expect(isValidDelegateeAddress(ZERO_ADDRESS)).toBe(false);
  });
});

describe('isSameAddress', () => {
  it('compares case-insensitively', () => {
    expect(isSameAddress(DELEGATEE, DELEGATEE.toLowerCase())).toBe(true);
  });

  it('detects different addresses', () => {
    expect(isSameAddress(DELEGATEE, WALLET)).toBe(false);
  });
});

describe('encodeDelegateCallData', () => {
  it('encodes the delegate(address) selector with a padded address', () => {
    expect(encodeDelegateCallData(DELEGATEE)).toBe(
      '0x5c19a95c000000000000000000000000e261d618a959afffd53168cd07d12e37b26761db',
    );
  });
});

describe('buildDelegateCall', () => {
  it('targets the delegate function with the delegatee parameter', () => {
    const call = buildDelegateCall(DELEGATEE);

    expect(call.functionName).toBe('delegate');
    expect(call.parameters).toEqual([DELEGATEE]);
    expect(call.contractAddress).toBe(getDelegationContracts().dimoToken);
  });
});

describe('readDelegationState', () => {
  type ReadArgs = { address: string; functionName: string; args: readonly string[] };

  const stubClient = (delegatee: string, balance: bigint) => ({
    readContract: vi.fn(async ({ functionName }: ReadArgs) => {
      if (functionName === 'delegates') {
        return delegatee;
      }

      return balance;
    }),
  });

  it('maps chain reads into delegation state', async () => {
    const client = stubClient(DELEGATEE, BigInt('1500000000000000000'));

    const state = await readDelegationState(client, WALLET);

    expect(state).toEqual({
      delegatee: DELEGATEE,
      isDelegated: true,
      balance: BigInt('1500000000000000000'),
    });
  });

  it('reports not delegated for the zero address', async () => {
    const client = stubClient(ZERO_ADDRESS, BigInt(5));

    const state = await readDelegationState(client, WALLET);

    expect(state.isDelegated).toBe(false);
  });

  it('queries the configured token contract for both reads', async () => {
    const client = stubClient(ZERO_ADDRESS, BigInt(0));

    await readDelegationState(client, WALLET);

    expect(client.readContract).toHaveBeenCalledTimes(2);

    for (const call of client.readContract.mock.calls) {
      expect(call[0].address).toBe(getDelegationContracts().dimoToken);
      expect(call[0].args).toEqual([WALLET]);
    }
  });
});

describe('formatDimoAmount', () => {
  it('formats zero', () => {
    expect(formatDimoAmount(BigInt(0))).toBe('0');
  });

  it('formats fractional amounts', () => {
    expect(formatDimoAmount(BigInt('1500000000000000000'))).toBe('1.5');
  });

  it('truncates long fractions to four places', () => {
    expect(formatDimoAmount(BigInt('1123456789000000000'))).toBe('1.1234');
  });

  it('adds thousands separators for large amounts', () => {
    expect(formatDimoAmount(BigInt('25000000000000000000000'))).toBe('25,000');
  });
});

describe('shortenAddress', () => {
  it('shortens a full address', () => {
    expect(shortenAddress(DELEGATEE)).toBe('0xE261...61db');
  });

  it('returns short inputs unchanged', () => {
    expect(shortenAddress('0x1234')).toBe('0x1234');
  });
});
