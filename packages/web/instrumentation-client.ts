import * as Sentry from '@sentry/nextjs';

/**
 * observability: browser Sentry init. Privacy-first, sovereignty-aligned:
 * - session replay DISABLED (no replay integration, no replay sample rates)
 * - sendDefaultPii false; beforeSend scrubs request bodies, cookies, user email/ip
 * Enabled whenever the DSN is present — `environment` separates dev from prod.
 */

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  debug: process.env.NODE_ENV !== 'production',
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'AbortError',
    'ChunkLoadError',
  ],
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['cookie'];
      }
    }
    if (event.user) {
      event.user = { id: event.user.id }; // user id only — no email, no ip
    }
    return event;
  },
});

// Instruments App Router navigations for tracing (v10 pattern)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
