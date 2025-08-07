export const FEATURE_FLAGS = {
  hiddenFromProduction: process.env.NEXT_PUBLIC_APP_VERSION === 'production',
  useAdvancedTransactions: process.env.NEXT_PUBLIC_USE_EXECUTE_ADVANCED_TRANSACTION === 'true',
} as const;
