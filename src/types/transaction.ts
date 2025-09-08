export type TransactionHistoryEntry = {
  from: string;
  to: string;
  value: bigint;
  time: string;
  type?: 'Baseline' | 'Referrals' | 'Marketplace' | 'CreditTopUp';
  description: string;
};

export type TransactionCategory = 'all' | 'baseline' | 'referrals' | 'marketplace' | 'other';

export type TransactionFilters = {
  category: TransactionCategory;
};
