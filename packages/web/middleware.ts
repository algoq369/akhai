import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://eu.i.posthog.com https://openpanel.dev https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com https://fonts.reown.com",
    "connect-src 'self' https://eu.i.posthog.com https://eu.posthog.com https://api.anthropic.com https://openrouter.ai https://api.brave.com https://openpanel.dev https://api.openpanel.dev https://*.ingest.de.sentry.io https://api.web3modal.org https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com wss: wss://*.walletconnect.org wss://*.walletconnect.com",
    "frame-src 'self' https://js.stripe.com https://verify.walletconnect.com https://verify.walletconnect.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API health check
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
