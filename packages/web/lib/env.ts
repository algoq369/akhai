import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side environment variables — never exposed to the browser.
   * The app will fail to build if these are missing.
   */
  server: {
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
    OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
    BRAVE_SEARCH_API_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * Client-side environment variables — bundled into the browser JS.
   * Must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },

  /**
   * Runtime environment variables for client-side access.
   * Required by Next.js — maps NEXT_PUBLIC_ vars to their values.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  /**
   * Skip validation in CI or when explicitly disabled.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Allow empty strings for optional vars in development.
   */
  emptyStringAsUndefined: true,
});
