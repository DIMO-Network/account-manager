import type {
  ABIItem,
  FunctionParameter,
  TransactionBuilderConfig,
  TransactionPreview,
} from './types';

import { encodeFunctionData } from 'viem';
import { getFunctionABI, validateABI } from './abi-manager';
import { estimateGas } from './gas-estimator';
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
   * Create transaction preview with gas estimation
   */
  async createTransactionPreview(from: `0x${string}`): Promise<TransactionPreview> {
    try {
      const networkConfig = getNetworkConfig(this.config.network);
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${this.config.network}`);
      }

      const data = this.buildTransactionData();

      // Estimate gas
      const gasEstimate = await estimateGas(Number.parseInt(this.config.network), {
        to: this.config.contractAddress as `0x${string}`,
        data: data as `0x${string}`,
        value: this.config.value || BigInt(0),
        from,
      });

      // Create function parameters for preview
      const functionABI = getFunctionABI(this.config.abi, this.config.functionName);
      const parameters: FunctionParameter[] = functionABI?.inputs.map((input, index) => ({
        name: input.name,
        type: input.type,
        value: this.config.parameters[index] || '',
        required: true,
      })) || [];

      return {
        to: this.config.contractAddress,
        data,
        value: this.config.value || BigInt(0),
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
