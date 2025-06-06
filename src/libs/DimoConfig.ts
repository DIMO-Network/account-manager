import { initializeDimoSDK } from '@dimo-network/login-with-dimo';

export const initializeDimo = () => {
  const clientId = process.env.NEXT_PUBLIC_DIMO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_DIMO_REDIRECT_URI;
  const apiKey = process.env.NEXT_PUBLIC_DIMO_API_KEY;
  const environment = process.env.NEXT_PUBLIC_DIMO_ENV as 'development' | 'production';

  if (!clientId || !redirectUri) {
    throw new Error('DIMO environment variables are not properly configured');
  }

  initializeDimoSDK({
    clientId,
    redirectUri,
    apiKey,
    environment,
    options: {
      forceEmail: true,
    },
  });

  console.warn('DIMO SDK initialized successfully');
};
