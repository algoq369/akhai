import * as Sentry from '@sentry/nextjs';

/**
 * observability: server + edge Sentry init (Next 15 instrumentation hook).
 * Privacy-first: no PII, no request bodies, no cookies, no query text — user id only.
 * Server DSN falls back to the public one (.env.local defines NEXT_PUBLIC_SENTRY_DSN;
 * a DSN is an ingest address, not a secret — the old SENTRY_DSN-only read left server
 * capture inert). Enabled whenever a DSN is present — `environment` separates dev from
 * prod streams; debug logs SDK activity in dev only.
 */

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

function scrub(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers['cookie'];
      delete event.request.headers['authorization'];
    }
  }
  if (event.user) {
    event.user = { id: event.user.id }; // user id only — no email, no ip, no username
  }
  return event;
}

const initOptions = {
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  debug: process.env.NODE_ENV !== 'production',
  beforeSend: scrub,
};

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(initOptions);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(initOptions);
  }
}

// Captures errors from nested React Server Components / route handlers (v10 pattern)
export const onRequestError = Sentry.captureRequestError;
