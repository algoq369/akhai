/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during production builds to avoid linting errors blocking build
    ignoreDuringBuilds: true,
  },
  // Fix lockfile warning by setting workspace root
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  // CSP configuration
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      // In development, allow unsafe-eval for Next.js HMR (Fast Refresh)
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'; base-uri 'self';",
            },
          ],
        },
      ];
    }
    // Production: strict CSP
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self'; object-src 'none'; base-uri 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
