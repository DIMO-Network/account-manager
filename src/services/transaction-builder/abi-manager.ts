import type { ABIItem, RecoveryTemplate } from './types';

// Common ABI definitions for recovery scenarios
export const COMMON_ABIS = {
  ERC20: [
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'amount', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      name: 'approve',
      type: 'function',
      inputs: [
        { name: 'spender', type: 'address', internalType: 'address' },
        { name: 'amount', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      name: 'transferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'address', internalType: 'address' },
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'amount', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
      stateMutability: 'nonpayable',
    },
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
      outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
      stateMutability: 'view',
    },
  ] as ABIItem[],

  ERC721: [
    {
      name: 'safeTransferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'address', internalType: 'address' },
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'transferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'address', internalType: 'address' },
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'approve',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'tokenId', type: 'uint256', internalType: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
      outputs: [{ name: '', type: 'address', internalType: 'address' }],
      stateMutability: 'view',
    },
  ] as ABIItem[],

  ERC1155: [
    {
      name: 'safeTransferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'address', internalType: 'address' },
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'id', type: 'uint256', internalType: 'uint256' },
        { name: 'amount', type: 'uint256', internalType: 'uint256' },
        { name: 'data', type: 'bytes', internalType: 'bytes' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'safeBatchTransferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'address', internalType: 'address' },
        { name: 'to', type: 'address', internalType: 'address' },
        { name: 'ids', type: 'uint256[]', internalType: 'uint256[]' },
        { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
        { name: 'data', type: 'bytes', internalType: 'bytes' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      name: 'setApprovalForAll',
      type: 'function',
      inputs: [
        { name: 'operator', type: 'address', internalType: 'address' },
        { name: 'approved', type: 'bool', internalType: 'bool' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  ] as ABIItem[],
};

// Recovery templates for common scenarios
export const RECOVERY_TEMPLATES: RecoveryTemplate[] = [
  {
    id: 'erc20-transfer',
    name: 'Transfer ERC-20 Token',
    description: 'Transfer ERC-20 tokens to another address (no approval needed)',
    contractType: 'ERC20',
    abi: COMMON_ABIS.ERC20,
    defaultFunction: 'transfer',
    parameterTemplates: [
      { name: 'to', type: 'address', value: '', required: true },
      { name: 'amount', type: 'uint256', value: '', required: true },
    ],
  },
  {
    id: 'erc721-approve',
    name: 'Approve NFT (ERC-721)',
    description: 'Approve transfer of NFT to another address',
    contractType: 'ERC721',
    abi: COMMON_ABIS.ERC721,
    defaultFunction: 'approve',
    parameterTemplates: [
      { name: 'to', type: 'address', value: '', required: true },
      { name: 'tokenId', type: 'uint256', value: '', required: true },
    ],
  },
  {
    id: 'erc721-transfer',
    name: 'Transfer NFT (ERC-721)',
    description: 'Transfer an NFT to another address',
    contractType: 'ERC721',
    abi: COMMON_ABIS.ERC721,
    defaultFunction: 'safeTransferFrom',
    parameterTemplates: [
      { name: 'from', type: 'address', value: '', required: true },
      { name: 'to', type: 'address', value: '', required: true },
      { name: 'tokenId', type: 'uint256', value: '', required: true },
    ],
  },
];

export const getABI = (contractType: string): ABIItem[] => {
  return COMMON_ABIS[contractType as keyof typeof COMMON_ABIS] || [];
};

export const getRecoveryTemplate = (templateId: string): RecoveryTemplate | null => {
  return RECOVERY_TEMPLATES.find(template => template.id === templateId) || null;
};

export const getRecoveryTemplates = (contractType?: string): RecoveryTemplate[] => {
  if (contractType) {
    return RECOVERY_TEMPLATES.filter(template => template.contractType === contractType);
  }
  return RECOVERY_TEMPLATES;
};

export const validateABI = (abi: any[]): boolean => {
  try {
    if (!Array.isArray(abi)) {
      return false;
    }

    return abi.every(item =>
      item
      && typeof item.name === 'string'
      && typeof item.type === 'string'
      && Array.isArray(item.inputs),
    );
  } catch {
    return false;
  }
};

export const getFunctionABI = (abi: ABIItem[], functionName: string): ABIItem | null => {
  return abi.find(item => item.name === functionName && item.type === 'function') || null;
};

export const getFunctionsFromABI = (abi: ABIItem[]): ABIItem[] => {
  return abi.filter(item => item.type === 'function');
};
