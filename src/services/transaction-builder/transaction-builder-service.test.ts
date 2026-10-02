import type { TransactionBuilderConfig } from './types';
import { decodeFunctionData } from 'viem';
import { COMMON_ABIS, getRecoveryTemplate, NATIVE_TRANSFER_TEMPLATE_ID } from './abi-manager';
import { createTransactionBuilder } from './transaction-builder-service';

const RECIPIENT = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x5fab9761d60419c9eeebe3915a8fa1ed7e8d2e1b';

const nativeConfig = (parameters: (string | number | boolean)[]): TransactionBuilderConfig => ({
  network: '1',
  contractAddress: '',
  abi: [],
  functionName: '',
  parameters,
  isNativeTransfer: true,
});

describe('TransactionBuilderService', () => {
  describe('native transfer', () => {
    it('should build a plain value transfer to the recipient with no calldata', () => {
      const builder = createTransactionBuilder(nativeConfig([RECIPIENT, '123456789123456789']));

      expect(builder.buildCall()).toEqual({
        to: RECIPIENT,
        value: BigInt('123456789123456789'),
        data: '0x',
      });
    });

    it('should preview the transfer value and recipient', async () => {
      const builder = createTransactionBuilder(nativeConfig([RECIPIENT, '500000000000000000']));

      const preview = await builder.createTransactionPreview();

      expect(preview.to).toBe(RECIPIENT);
      expect(preview.value).toBe(BigInt('500000000000000000'));
      expect(preview.data).toBe('0x');
    });

    it('should accept a valid recipient and positive amount', () => {
      const builder = createTransactionBuilder(nativeConfig([RECIPIENT, '1']));

      expect(builder.validateConfig()).toEqual({ isValid: true, errors: [] });
    });

    it('should reject an invalid recipient', () => {
      const builder = createTransactionBuilder(nativeConfig(['0x1234', '1']));

      expect(builder.validateConfig().errors).toContain('Invalid recipient address');
    });

    it('should reject the zero address as recipient', () => {
      const builder = createTransactionBuilder(nativeConfig(['0x0000000000000000000000000000000000000000', '1']));

      expect(builder.validateConfig().errors).toContain('Recipient cannot be the zero address');
    });

    it('should reject sending to the sending smart account itself', () => {
      const builder = createTransactionBuilder({
        ...nativeConfig([RECIPIENT, '1']),
        fromAddress: RECIPIENT.toUpperCase().replace('0X', '0x'),
      });

      expect(builder.validateConfig().errors).toContain('Recipient cannot be your own smart account');
    });

    it('should reject a zero or malformed amount', () => {
      expect(createTransactionBuilder(nativeConfig([RECIPIENT, '0'])).validateConfig().errors)
        .toContain('Amount must be greater than 0');
      expect(createTransactionBuilder(nativeConfig([RECIPIENT, 'abc'])).validateConfig().errors)
        .toContain('Amount must be greater than 0');
    });

    it('should expose recipient and amount as the function parameters', () => {
      const builder = createTransactionBuilder(nativeConfig([]));

      expect(builder.getFunctionParameters('').map(p => [p.name, p.type])).toEqual([
        ['to', 'address'],
        ['amount', 'uint256'],
      ]);
    });

    it('should be offered as a recovery template', () => {
      const template = getRecoveryTemplate(NATIVE_TRANSFER_TEMPLATE_ID);

      expect(template?.contractType).toBe('NATIVE');
    });
  });

  describe('contract call', () => {
    it('should encode an ERC-20 transfer to the token contract with zero value', () => {
      const builder = createTransactionBuilder({
        network: '1',
        contractAddress: TOKEN,
        abi: COMMON_ABIS.ERC20,
        functionName: 'transfer',
        parameters: [RECIPIENT, '1000'],
      });

      const call = builder.buildCall();
      const decoded = decodeFunctionData({ abi: COMMON_ABIS.ERC20, data: call.data });

      expect(call.to).toBe(TOKEN);
      expect(call.value).toBe(BigInt('0'));
      expect(decoded.functionName).toBe('transfer');
      expect(decoded.args).toEqual([RECIPIENT, BigInt('1000')]);
    });
  });
});
