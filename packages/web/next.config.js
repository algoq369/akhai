/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Always use relaxed CSP in development to avoid blocking Next.js features
    const isDev = process.env.NODE_ENV !== 'production';

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
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org; font-src 'self' data: blob: https://fonts.gstatic.com https://fonts.googleapis.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; img-src 'self' data: blob: https:; connect-src 'self' http://127.0.0.1:7242 https://api.anthropic.com https://api.deepseek.com https://api.mistral.ai https://api.x.ai https://api.coingecko.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://api.stripe.com https://js.stripe.com wss://*.walletconnect.com wss://*.walletconnect.org wss://*.reown.com https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com https://*.web3modal.com https://*.web3modal.org; frame-src https://js.stripe.com https://hooks.stripe.com https://verify.walletconnect.com https://verify.walletconnect.org https://*.reown.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org; font-src 'self' data: blob: https://fonts.gstatic.com https://fonts.googleapis.com https://*.web3modal.com https://*.web3modal.org https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.anthropic.com https://api.deepseek.com https://api.mistral.ai https://api.x.ai https://api.coingecko.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://api.stripe.com https://js.stripe.com wss://*.walletconnect.com wss://*.walletconnect.org wss://*.reown.com https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com https://*.web3modal.com https://*.web3modal.org; frame-src https://js.stripe.com https://hooks.stripe.com https://verify.walletconnect.com https://verify.walletconnect.org https://*.reown.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
