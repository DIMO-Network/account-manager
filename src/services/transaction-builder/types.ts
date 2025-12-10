// Transaction Builder Types

export type TransactionBuilderConfig = {
  network: string;
  contractAddress: string;
  abi: ABIItem[];
  functionName: string;
  parameters: (string | number | boolean)[];
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
};

export type NetworkConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

export type ABIItem = {
  name: string;
  type: string;
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  stateMutability?: string;
};

export type FunctionParameter = {
  name: string;
  type: string;
  value: string | number | boolean;
  required: boolean;
};

export type TransactionPreview = {
  to: string;
  data: string;
  value: bigint;
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedCost: string;
  functionName: string;
  parameters: FunctionParameter[];
};

export type TransactionResult = {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl: string;
  gasUsed?: bigint;
  blockNumber?: number;
};

export type RecoveryTemplate = {
  id: string;
  name: string;
  description: string;
  contractType: 'ERC20' | 'ERC721' | 'ERC1155' | 'CUSTOM';
  abi: ABIItem[];
  defaultFunction: string;
  parameterTemplates: FunctionParameter[];
};

export type SupportedChains = 'ethereum' | 'polygon' | 'base' | 'optimism' | 'arbitrum';
