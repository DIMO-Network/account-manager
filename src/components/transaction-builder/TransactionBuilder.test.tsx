import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TransactionBuilder } from './TransactionBuilder';

const mocks = vi.hoisted(() => ({
  executeTransaction: vi.fn(),
  getBalance: vi.fn(),
}));

vi.mock('@/services/recovery/recovery-service', () => ({
  createRecoveryService: vi.fn(async () => ({ executeTransaction: mocks.executeTransaction })),
}));

vi.mock('@/services/recovery/zerodev-service', () => ({
  getPublicClient: () => ({ getBalance: mocks.getBalance }),
}));

const WALLET = '0xAbCdEf0000000000000000000000000000000001';
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const ONE_ETH = BigInt('1000000000000000000');

const renderBuilder = () => render(
  <TransactionBuilder
    networkId="1"
    walletAddress={WALLET}
    sessionData={{ dimoToken: 'token', subOrganizationId: 'sub-org', walletAddress: WALLET }}
  />,
);

// Select the native transfer, send the full balance to RECIPIENT and open the preview
const previewMaxNativeTransfer = async () => {
  fireEvent.click(screen.getByRole('button', { name: /Transfer Native Token/ }));
  fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: RECIPIENT } });
  fireEvent.click(await screen.findByRole('button', { name: 'Use max' }));
  fireEvent.click(screen.getByRole('button', { name: 'Preview Transaction' }));
  await screen.findByText('3. Transaction Preview');
};

describe('TransactionBuilder native transfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    Element.prototype.scrollIntoView = vi.fn();
    mocks.getBalance.mockResolvedValue(ONE_ETH);
  });

  it('should send the full balance once and not allow executing the same preview again', async () => {
    mocks.executeTransaction.mockResolvedValue({ success: true, transactionHash: '0xtx' });
    renderBuilder();
    await previewMaxNativeTransfer();

    fireEvent.click(screen.getByRole('button', { name: 'Execute Transaction' }));
    await screen.findByText('Transaction Successful');
    fireEvent.click(screen.getByRole('button', { name: 'Executed' }));

    expect(screen.getByRole('button', { name: 'Executed' })).toBeDisabled();
    expect(mocks.executeTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.executeTransaction).toHaveBeenCalledWith({
      targetChain: 'ETHEREUM',
      to: RECIPIENT,
      value: ONE_ETH,
      data: '0x',
    });
  });

  it('should refresh the balance after a successful send', async () => {
    mocks.executeTransaction.mockResolvedValue({ success: true, transactionHash: '0xtx' });
    renderBuilder();
    await previewMaxNativeTransfer();
    mocks.getBalance.mockResolvedValue(BigInt(0));

    fireEvent.click(screen.getByRole('button', { name: 'Execute Transaction' }));

    expect(await screen.findByText('Available: 0 ETH')).toBeInTheDocument();
    expect(mocks.getBalance).toHaveBeenCalledTimes(2);
  });

  it('should lock the form while the transfer is in flight', async () => {
    let finishSend: (result: { success: boolean; transactionHash: string }) => void = () => {};
    mocks.executeTransaction.mockReturnValue(new Promise((resolve) => {
      finishSend = resolve;
    }));
    renderBuilder();
    await previewMaxNativeTransfer();

    fireEvent.click(screen.getByRole('button', { name: 'Execute Transaction' }));

    await waitFor(() => expect(screen.getByPlaceholderText('0x...')).toBeDisabled());

    await act(async () => {
      finishSend({ success: true, transactionHash: '0xtx' });
    });

    expect(await screen.findByText('Transaction Successful')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0x...')).toBeEnabled();
  });

  it('should show a validation error for a malformed amount instead of failing silently', async () => {
    renderBuilder();
    fireEvent.click(screen.getByRole('button', { name: /Transfer Native Token/ }));
    fireEvent.change(screen.getByPlaceholderText('0x...'), { target: { value: RECIPIENT } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0.0' } });

    fireEvent.click(screen.getByRole('button', { name: 'Preview Transaction' }));

    expect(await screen.findByText(/required fields: amount/)).toBeInTheDocument();
    expect(mocks.executeTransaction).not.toHaveBeenCalled();
  });
});
