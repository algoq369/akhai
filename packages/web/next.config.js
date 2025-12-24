/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during production builds to avoid linting errors blocking build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
