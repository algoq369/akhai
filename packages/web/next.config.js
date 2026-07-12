// Sentry is optional — gracefully degrade if not installed
let withSentryConfig
try {
  withSentryConfig = require('@sentry/nextjs').withSentryConfig
} catch {
  withSentryConfig = (config) => config
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Transpile xyflow for CSS imports
  transpilePackages: ['@xyflow/react'],
  eslint: {
    // Disable ESLint during production builds to avoid linting errors blocking build
    ignoreDuringBuilds: true,
  },
  // Fix lockfile warning by setting workspace root
  outputFileTracingRoot: require('path').join(__dirname, '../../'),

  // Hide Next.js development indicator (N button in bottom left)
  devIndicators: false,

  // Webpack configuration for production builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'posthog-node': false,
        'async_hooks': false,
        'node:async_hooks': false,
      };
    }
    return config;
  },
  // Reverse proxy for PostHog to avoid ad blockers
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  // Relaxed CSP for development - allows all necessary Next.js features
  async headers() {
    // Single reconciled CSP (E4.5a) — union of the former middleware + next.config policies so no
    // origin is silently blocked; 'unsafe-inline'/'unsafe-eval' kept (nonce tightening is E4.5b, parked).
    const csp =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://eu.i.posthog.com https://openpanel.dev https://js.stripe.com https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org; img-src 'self' blob: data: https:; font-src 'self' data: blob: https://fonts.gstatic.com https://fonts.googleapis.com https://fonts.reown.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; connect-src 'self' https://api.anthropic.com https://openrouter.ai https://api.brave.com https://api.coingecko.com https://eu.i.posthog.com https://eu.posthog.com https://eu-assets.i.posthog.com https://openpanel.dev https://api.openpanel.dev https://*.ingest.de.sentry.io https://api.stripe.com https://js.stripe.com https://api.web3modal.org https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com wss: wss://*.walletconnect.com wss://*.walletconnect.org wss://*.reown.com; frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://verify.walletconnect.com https://verify.walletconnect.org https://*.reown.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry is configured but source map upload is disabled until DSN is set
  // To enable: add SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN to .env.local
  silent: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
});
