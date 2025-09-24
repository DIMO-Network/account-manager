import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const Env = createEnv({
  server: {
    ARCJET_KEY: z.string().startsWith('ajkey_').optional(),
    LOGTAIL_SOURCE_TOKEN: z.string().optional(),
    TURNKEY_API_PRIVATE_KEY: z.string().optional(),
    TURNKEY_API_PUBLIC_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
    NEXT_PUBLIC_TURNKEY_API_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID: z.string().optional(),
    NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL: z.string().url().optional(),
    NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC_URL: z.string().url().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN,
    TURNKEY_API_PRIVATE_KEY: process.env.TURNKEY_API_PRIVATE_KEY,
    TURNKEY_API_PUBLIC_KEY: process.env.TURNKEY_API_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_TURNKEY_API_BASE_URL: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL,
    NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID,
    NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL: process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC_URL,
    NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC_URL: process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC_URL,
  },
});
