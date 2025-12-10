// Default contract addresses for common tokens across networks
// Used in the transaction builder for quick token selection

export type ContractAddress = {
  name: string;
  address: string;
  explorer: string;
  network: string;
  chainId: string;
  tokenType: 'ERC-20' | 'ERC-721';
};

// All available contract addresses organized by token type
export const CONTRACT_ADDRESSES: Record<string, ContractAddress[]> = {
  // ERC-20 Tokens
  erc20: [
    // Testnet (OMID)
    {
      name: 'OMID (Sepolia Ethereum)',
      address: '0xA40C0a17c21fe335308Be305a3315B14bBeD5157',
      explorer: 'https://sepolia.etherscan.io/address/0xA40C0a17c21fe335308Be305a3315B14bBeD5157',
      network: 'Sepolia',
      chainId: '11155111',
      tokenType: 'ERC-20',
    },
    {
      name: 'OMID (Amoy Polygon)',
      address: '0x21cFE003997fB7c2B3cfe5cf71e7833B7B2eCe10',
      explorer: 'https://amoy.polygonscan.com/address/0x21cFE003997fB7c2B3cfe5cf71e7833B7B2eCe10',
      network: 'Amoy',
      chainId: '80002',
      tokenType: 'ERC-20',
    },
    {
      name: 'OMID (Base Sepolia)',
      address: '0xA40C0a17c21fe335308Be305a3315B14bBeD5157',
      explorer: 'https://sepolia.basescan.org/address/0xA40C0a17c21fe335308Be305a3315B14bBeD5157',
      network: 'Base Sepolia',
      chainId: '84532',
      tokenType: 'ERC-20',
    },
    // Mainnet (DIMO)
    {
      name: 'DIMO (Ethereum)',
      address: '0x5fab9761d60419c9eeebe3915a8fa1ed7e8d2e1b',
      explorer: 'https://etherscan.io/token/0x5fab9761d60419c9eeebe3915a8fa1ed7e8d2e1b',
      network: 'Ethereum',
      chainId: '1',
      tokenType: 'ERC-20',
    },
    {
      name: 'DIMO (Polygon)',
      address: '0xe261d618a959afffd53168cd07d12e37b26761db',
      explorer: 'https://polygonscan.com/address/0xe261d618a959afffd53168cd07d12e37b26761db',
      network: 'Polygon',
      chainId: '137',
      tokenType: 'ERC-20',
    },
    {
      name: 'DIMO (Base)',
      address: '0x5eAA326fB2fc97fAcCe6A79A304876daD0F2e96c',
      explorer: 'https://basescan.org/address/0x5eAA326fB2fc97fAcCe6A79A304876daD0F2e96c',
      network: 'Base',
      chainId: '8453',
      tokenType: 'ERC-20',
    },
  ],
  // ERC-721 Tokens (NFTs) - Add common NFT contracts here when needed
  erc721: [
    // Example NFT contracts can be added here
    // {
    //   name: 'Example NFT (Ethereum)',
    //   address: '0x...',
    //   explorer: 'https://etherscan.io/address/0x...',
    //   network: 'Ethereum',
    //   chainId: '1',
    //   tokenType: 'ERC-721',
    // },
  ],
};

/**
 * Get contract addresses for a specific token type and network
 * @param tokenType - The type of token (erc20, erc721)
 * @param chainId - The chain ID to filter by
 * @returns Array of contract addresses for the specified token type and network
 */
export const getContractAddresses = (tokenType: string, chainId?: string): ContractAddress[] => {
  const addresses = CONTRACT_ADDRESSES[tokenType] || [];

  if (!chainId) {
    return addresses;
  }

  return addresses.filter(contract => contract.chainId === chainId);
};

/**
 * Get all contract addresses for a specific network
 * @param chainId - The chain ID to filter by
 * @returns Array of all contract addresses for the specified network
 */
export const getContractAddressesByNetwork = (chainId: string): ContractAddress[] => {
  const allAddresses = Object.values(CONTRACT_ADDRESSES).flat();
  return allAddresses.filter(contract => contract.chainId === chainId);
};

/**
 * Get contract address by address string
 * @param address - The contract address to search for
 * @returns The contract address object or null if not found
 */
export const getContractAddressByAddress = (address: string): ContractAddress | null => {
  const allAddresses = Object.values(CONTRACT_ADDRESSES).flat();
  return allAddresses.find(contract =>
    contract.address.toLowerCase() === address.toLowerCase(),
  ) || null;
};
