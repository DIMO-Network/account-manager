import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { encodeFunctionData, erc20Abi } from 'viem';
import { TransactionBuilder } from './TransactionBuilder';

const mocks = vi.hoisted(() => ({
  executeTransaction: vi.fn(),
  getBalance: vi.fn(),
  readContract: vi.fn(),
}));

vi.mock('@/services/recovery/recovery-service', () => ({
  createRecoveryService: vi.fn(async () => ({ executeTransaction: mocks.executeTransaction })),
}));

vi.mock('@/services/recovery/zerodev-service', () => ({
  getPublicClient: () => ({ getBalance: mocks.getBalance, readContract: mocks.readContract }),
}));

const WALLET = '0xAbCdEf0000000000000000000000000000000001';
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const ONE_ETH = BigInt('1000000000000000000');
// Bridged USDC (USDC.e) on Polygon, 6 decimals
const USDC_E = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

const renderBuilder = (networkId = '1') => render(
  <TransactionBuilder
    networkId={networkId}
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

describe('TransactionBuilder ERC-20 transfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    Element.prototype.scrollIntoView = vi.fn();
    mocks.readContract.mockImplementation(async ({ address }: { address: string }) => (address === USDC_E ? 6 : 18));
  });

  // Select the ERC-20 transfer on Polygon and point it at the given token
  const selectToken = async (token: string) => {
    fireEvent.change(screen.getByLabelText('Token/Contract Address'), { target: { value: token } });
    await waitFor(() => expect(mocks.readContract).toHaveBeenLastCalledWith(expect.objectContaining({ address: token })));
  };

  it('should send a custom token amount in that token\'s decimals', async () => {
    mocks.executeTransaction.mockResolvedValue({ success: true, transactionHash: '0xtx' });
    renderBuilder('137');
    fireEvent.click(screen.getByRole('button', { name: /Transfer ERC-20 Token/ }));
    await selectToken(USDC_E);

    fireEvent.change((await screen.findAllByPlaceholderText('0x...'))[1]!, { target: { value: RECIPIENT } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '170.235' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Transaction' }));
    await screen.findByText('3. Transaction Preview');
    fireEvent.click(screen.getByRole('button', { name: 'Execute Transaction' }));
    await screen.findByText('Transaction Successful');

    expect(mocks.executeTransaction).toHaveBeenCalledWith({
      targetChain: 'POLYGON',
      to: USDC_E,
      value: BigInt(0),
      data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [RECIPIENT, BigInt(170235000)] }),
    });
  });

  it('should clear the amount when the token changes', async () => {
    renderBuilder('137');
    fireEvent.click(screen.getByRole('button', { name: /Transfer ERC-20 Token/ }));
    fireEvent.change(await screen.findByRole('spinbutton'), { target: { value: '170' } });

    await selectToken(USDC_E);

    expect(await screen.findByRole('spinbutton')).toHaveDisplayValue('');
  });

  it('should clear the shown amount when the same token is picked again', async () => {
    renderBuilder('137');
    fireEvent.click(screen.getByRole('button', { name: /Transfer ERC-20 Token/ }));
    fireEvent.change(await screen.findByRole('spinbutton'), { target: { value: '170' } });

    // Same token, so its decimals are already known and the inputs stay mounted
    fireEvent.click(screen.getByRole('button', { name: /DIMO \(Polygon\)/ }));

    expect(screen.getByRole('spinbutton')).toHaveDisplayValue('');
  });

  it('should not build a transfer when the token\'s decimals can\'t be read', async () => {
    mocks.readContract.mockRejectedValue(new Error('execution reverted'));
    renderBuilder('137');
    fireEvent.click(screen.getByRole('button', { name: /Transfer ERC-20 Token/ }));
    await selectToken(USDC_E);

    expect(await screen.findByText(/Couldn't read this token's decimals/)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview Transaction' })).toBeDisabled();
  });
});
