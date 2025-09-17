export const FEATURE_FLAGS = {
  hiddenFromProduction: process.env.NEXT_PUBLIC_APP_VERSION === 'production',
} as const;
