export type CreditBalanceRequest = {
  amount: number;
  currency?: string;
  description?: string;
  txHash: string; // Required for DIMO token conversions
  metadata?: Record<string, string>;
};

export type CreditBalanceResponse = {
  success: true;
  transactionId: string;
  amount: number;
  currency: string;
};

export type CreditBalanceError = {
  error: string;
  details?: string;
  alreadyProcessed?: boolean;
};

export type TransactionValidationResponse = {
  dimoAmount: number;
  usdValue: number;
  transactionFrom: string;
  userWallet: string;
};

export type TransactionValidationError = {
  error: string;
  alreadyProcessed?: boolean;
};
