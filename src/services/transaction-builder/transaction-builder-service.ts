import type { Address } from 'viem';
import type {
  ABIItem,
  FunctionParameter,
  TransactionBuilderConfig,
  TransactionCall,
  TransactionPreview,
} from './types';

import { encodeFunctionData, isAddress, isAddressEqual, zeroAddress } from 'viem';
import { getFunctionABI, getRecoveryTemplate, NATIVE_TRANSFER_TEMPLATE_ID, validateABI } from './abi-manager';
import { getNetworkConfig } from './network-config';

export class TransactionBuilderService {
  private config: TransactionBuilderConfig;

  constructor(config: TransactionBuilderConfig) {
    this.config = config;
  }

  /**
   * Build transaction data from ABI and parameters
   */
  buildTransactionData(): string {
    try {
      if (!validateABI(this.config.abi)) {
        throw new Error('Invalid ABI provided');
      }

      const functionABI = getFunctionABI(this.config.abi, this.config.functionName);
      if (!functionABI) {
        throw new Error(`Function ${this.config.functionName} not found in ABI`);
      }

      // Encode function data using the ABI directly
      const data = encodeFunctionData({
        abi: this.config.abi,
        functionName: this.config.functionName,
        args: this.config.parameters,
      });

      return data;
    } catch (error) {
      console.error('Failed to build transaction data:', error);
      throw new Error(`Failed to build transaction data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse the native transfer amount (wei); null if it isn't a positive integer
   */
  private getNativeTransferAmount(): bigint | null {
    try {
      const amount = BigInt(String(this.config.parameters[1] ?? ''));
      return amount > BigInt(0) ? amount : null;
    } catch {
      return null;
    }
  }

  /**
   * Build the call the smart account will execute
   */
  buildCall(): TransactionCall {
    if (this.config.isNativeTransfer) {
      const amount = this.getNativeTransferAmount();
      if (amount === null) {
        throw new Error('Amount must be greater than 0');
      }

      return {
        to: String(this.config.parameters[0]) as Address,
        value: amount,
        data: '0x',
      };
    }

    return {
      to: this.config.contractAddress as Address,
      value: this.config.value || BigInt(0),
      data: this.buildTransactionData() as TransactionCall['data'],
    };
  }

  /**
   * Create transaction preview with gas estimation
   */
  async createTransactionPreview(): Promise<TransactionPreview> {
    try {
      const networkConfig = getNetworkConfig(this.config.network);
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${this.config.network}`);
      }

      const call = this.buildCall();

      // For Account Abstraction transactions, skip gas estimation and show paymaster info
      // Standard eth_estimateGas fails for AA because it simulates wrong execution path
      const gasEstimate = {
        gasLimit: BigInt(200000), // Typical AA transaction gas limit
        gasPrice: BigInt(0), // User pays nothing - paymaster covers it
        estimatedCost: 'Sponsored by ZeroDev Paymaster',
      };

      // Create function parameters for preview (a native transfer is fully described by to + value)
      const functionABI = getFunctionABI(this.config.abi, this.config.functionName);
      const parameters: FunctionParameter[] = functionABI?.inputs.map((input, index) => ({
        name: input.name,
        type: input.type,
        value: this.config.parameters[index] || '',
        required: true,
      })) || [];

      return {
        to: call.to,
        data: call.data,
        value: call.value,
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice,
        estimatedCost: gasEstimate.estimatedCost,
        functionName: this.config.functionName,
        parameters,
      };
    } catch (error) {
      console.error('Failed to create transaction preview:', error);
      throw new Error(`Failed to create transaction preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate transaction configuration
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate network
    const networkConfig = getNetworkConfig(this.config.network);
    if (!networkConfig) {
      errors.push(`Unsupported network: ${this.config.network}`);
    }

    if (this.config.isNativeTransfer) {
      const recipient = String(this.config.parameters[0] ?? '');
      if (!isAddress(recipient)) {
        errors.push('Invalid recipient address');
      } else if (isAddressEqual(recipient, zeroAddress)) {
        // Funds sent to the zero address are burned
        errors.push('Recipient cannot be the zero address');
      } else if (this.config.fromAddress && isAddress(this.config.fromAddress) && isAddressEqual(recipient, this.config.fromAddress)) {
        errors.push('Recipient cannot be your own smart account');
      }

      if (this.getNativeTransferAmount() === null) {
        errors.push('Amount must be greater than 0');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    }

    // Validate contract address
    if (!this.config.contractAddress || !this.config.contractAddress.startsWith('0x')) {
      errors.push('Invalid contract address');
    }

    // Validate ABI
    if (!validateABI(this.config.abi)) {
      errors.push('Invalid ABI provided');
    }

    // Validate function name
    if (!this.config.functionName) {
      errors.push('Function name is required');
    }

    // Validate parameters
    const functionABI = getFunctionABI(this.config.abi, this.config.functionName);
    if (functionABI) {
      const requiredParams = functionABI.inputs.filter(input => input.name);
      if (this.config.parameters.length < requiredParams.length) {
        errors.push(`Missing required parameters for function ${this.config.functionName}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available functions from ABI
   */
  getAvailableFunctions(): ABIItem[] {
    if (!validateABI(this.config.abi)) {
      return [];
    }

    return this.config.abi.filter(item =>
      item.type === 'function'
      && item.stateMutability !== 'view'
      && item.stateMutability !== 'pure',
    );
  }

  /**
   * Get function parameters for a specific function
   */
  getFunctionParameters(functionName: string): FunctionParameter[] {
    if (this.config.isNativeTransfer) {
      const template = getRecoveryTemplate(NATIVE_TRANSFER_TEMPLATE_ID);
      return template?.parameterTemplates.map(param => ({ ...param })) || [];
    }

    const functionABI = getFunctionABI(this.config.abi, functionName);
    if (!functionABI) {
      return [];
    }

    return functionABI.inputs.map(input => ({
      name: input.name,
      type: input.type,
      value: '',
      required: true,
    }));
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<TransactionBuilderConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): TransactionBuilderConfig {
    return { ...this.config };
  }
}

/**
 * Create a new transaction builder instance
 */
export const createTransactionBuilder = (config: TransactionBuilderConfig): TransactionBuilderService => {
  return new TransactionBuilderService(config);
};

/**
 * Utility function to create a basic transaction builder for common scenarios
 */
export const createBasicTransactionBuilder = (
  network: string,
  contractAddress: string,
  abi: ABIItem[],
  functionName: string,
  parameters: any[] = [],
): TransactionBuilderService => {
  return new TransactionBuilderService({
    network,
    contractAddress,
    abi,
    functionName,
    parameters,
  });
};
