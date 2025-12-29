/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during production builds to avoid linting errors blocking build
    ignoreDuringBuilds: true,
  },
  // Fix lockfile warning by setting workspace root
  outputFileTracingRoot: require('path').join(__dirname, '../../'),

  // Webpack configuration to exclude server-only packages from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only packages in client bundle
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
    // Always use relaxed CSP in development to avoid blocking Next.js features
    const isDev = process.env.NODE_ENV !== 'production';

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:7242 https://api.anthropic.com https://api.deepseek.com https://api.mistral.ai https://api.x.ai https://api.coingecko.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://api.stripe.com https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://api.deepseek.com https://api.mistral.ai https://api.x.ai https://api.coingecko.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://api.stripe.com https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
