import { RecoveryService } from './recovery-service';
import { SupportedChains } from './turnkey-bridge';

const mocks = vi.hoisted(() => ({
  getKernelClient: vi.fn(),
  sendUserOperation: vi.fn(),
  waitForUserOperationReceipt: vi.fn(),
  encodeCalls: vi.fn(),
}));

vi.mock('./turnkey-bridge', async importOriginal => ({
  ...(await importOriginal<typeof import('./turnkey-bridge')>()),
  getTurnkeyClient: vi.fn(() => ({})),
  getTurnkeyWalletAddress: vi.fn(async () => '0x2222222222222222222222222222222222222222'),
}));

vi.mock('./zerodev-service', () => ({
  getKernelClient: mocks.getKernelClient,
}));

const WALLET = '0xAbCdEf0000000000000000000000000000000001';
const OTHER = '0x9999999999999999999999999999999999999999';
const RECIPIENT = '0x1111111111111111111111111111111111111111';

const kernelClientAt = (address: string) => ({
  account: { address, encodeCalls: mocks.encodeCalls },
  sendUserOperation: mocks.sendUserOperation,
  waitForUserOperationReceipt: mocks.waitForUserOperationReceipt,
});

const createService = () => new RecoveryService({
  dimoToken: 'bundle',
  subOrganizationId: 'sub-org',
  walletAddress: WALLET,
  eKey: 'ekey',
});

describe('RecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendUserOperation.mockResolvedValue('0xuserop');
    mocks.encodeCalls.mockResolvedValue('0xencoded');
    mocks.waitForUserOperationReceipt.mockResolvedValue({ success: true, receipt: { transactionHash: '0xtx' } });
  });

  describe('deployAccount', () => {
    it('should deploy when the derived smart account matches the DIMO wallet', async () => {
      mocks.getKernelClient.mockResolvedValue(kernelClientAt(WALLET.toLowerCase()));

      const result = await createService().deployAccount(SupportedChains.ETHEREUM);

      expect(result).toEqual({ success: true, transactionHash: '0xuserop' });
      expect(mocks.sendUserOperation).toHaveBeenCalledTimes(1);
    });

    it('should refuse to deploy when the derived smart account differs from the DIMO wallet', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.getKernelClient.mockResolvedValue(kernelClientAt(OTHER));

      const result = await createService().deployAccount(SupportedChains.ETHEREUM);

      expect(result.success).toBe(false);
      expect(result.error).toContain(OTHER);
      expect(result.error).toContain(WALLET);
      expect(mocks.sendUserOperation).not.toHaveBeenCalled();
    });
  });

  describe('executeTransaction', () => {
    it('should send the given call and return the mined transaction hash', async () => {
      mocks.getKernelClient.mockResolvedValue(kernelClientAt(WALLET));

      const result = await createService().executeTransaction({
        targetChain: SupportedChains.BASE,
        to: RECIPIENT,
        value: BigInt('42'),
        data: '0x',
      });

      expect(result).toEqual({ success: true, transactionHash: '0xtx' });
      expect(mocks.encodeCalls).toHaveBeenCalledWith([{ to: RECIPIENT, value: BigInt('42'), data: '0x' }]);
      expect(mocks.sendUserOperation).toHaveBeenCalledWith({ callData: '0xencoded' });
      expect(mocks.waitForUserOperationReceipt).toHaveBeenCalledWith({ hash: '0xuserop' });
    });

    it('should report failure when the user operation reverts on-chain', async () => {
      mocks.getKernelClient.mockResolvedValue(kernelClientAt(WALLET));
      mocks.waitForUserOperationReceipt.mockResolvedValue({ success: false, receipt: { transactionHash: '0xtx' } });

      const result = await createService().executeTransaction({
        targetChain: SupportedChains.BASE,
        to: RECIPIENT,
        value: BigInt('42'),
        data: '0x',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('0xtx');
    });

    it('should refuse to send when the derived smart account differs from the DIMO wallet', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.getKernelClient.mockResolvedValue(kernelClientAt(OTHER));

      const result = await createService().executeTransaction({
        targetChain: SupportedChains.BASE,
        to: RECIPIENT,
        value: BigInt('42'),
        data: '0x',
      });

      expect(result.success).toBe(false);
      expect(mocks.sendUserOperation).not.toHaveBeenCalled();
    });
  });
});
