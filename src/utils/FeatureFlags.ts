type Environment = 'development' | 'staging' | 'production';

type FeatureFlags = {
  useBackendProxy: boolean;
  backendApiUrl: string;
};

const getEnvironment = (): Environment => {
  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }
  if (process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'test') {
    return 'staging';
  }
  return 'production';
};

const getBackendApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
};

export const featureFlags: FeatureFlags = {
  useBackendProxy: process.env.NEXT_PUBLIC_USE_BACKEND_PROXY === 'true',
  backendApiUrl: getBackendApiUrl(),
} as const;

// Helper function for debugging
export const debugFeatureFlags = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('🚩 Feature Flags Configuration:', {
      ...featureFlags,
      environment: getEnvironment(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
  }
};

export const isProductionMode = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_VERSION === 'production';
};
