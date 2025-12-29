# AkhAI Web - Production Dockerfile
FROM node:20-alpine AS base

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all package.json files for workspace dependencies
COPY packages/web/package.json ./packages/web/
COPY packages/core/package.json ./packages/core/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/web ./packages/web

# Build core package first
WORKDIR /app/packages/core
RUN pnpm build

# Build web application
WORKDIR /app/packages/web
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files
COPY packages/web/package.json ./packages/web/
COPY packages/core/package.json ./packages/core/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built core package
COPY --from=base /app/packages/core/dist ./packages/core/dist
COPY --from=base /app/packages/core/package.json ./packages/core/

# Copy built web application
COPY --from=base /app/packages/web/.next ./packages/web/.next
COPY --from=base /app/packages/web/public ./packages/web/public
COPY --from=base /app/packages/web/next.config.js ./packages/web/
COPY --from=base /app/packages/web/package.json ./packages/web/
COPY --from=base /app/packages/web/tailwind.config.ts ./packages/web/
COPY --from=base /app/packages/web/postcss.config.js ./packages/web/
COPY --from=base /app/packages/web/tsconfig.json ./packages/web/

# Create data directory for SQLite
RUN mkdir -p /app/packages/web/data && chmod 755 /app/packages/web/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start the application
WORKDIR /app/packages/web
CMD ["pnpm", "start"]

