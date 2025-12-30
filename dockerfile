# ============================================================================
# DOCKERFILE - UMKM Multi-Tenant Backend
# API Only - Database via Supabase
# ============================================================================

# ============================================================================
# Development Stage (untuk local development)
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm, OpenSSL, and curl
RUN npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl curl

# Configure pnpm dengan Taobao Mirror (untuk koneksi Indonesia/Asia)
RUN pnpm config set registry https://registry.npmmirror.com \
  && pnpm config set network-timeout 300000 \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-mintimeout 20000 \
  && pnpm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies dengan retry
RUN pnpm install || pnpm install || pnpm install

# Generate Prisma Client
RUN pnpm exec prisma generate

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Expose port
EXPOSE 8000

# Development command with hot reload
CMD ["sh", "-c", "pnpm exec prisma db push --accept-data-loss --skip-generate && pnpm run start:dev"]

# ============================================================================
# Builder Stage (untuk production build)
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and OpenSSL
RUN npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl

# Configure pnpm dengan Taobao Mirror
RUN pnpm config set registry https://registry.npmmirror.com \
  && pnpm config set network-timeout 300000 \
  && pnpm config set fetch-retries 5

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma Client
RUN pnpm exec prisma generate

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Prune to production dependencies
RUN pnpm prune --prod

# ============================================================================
# Production Stage (untuk Railway/production)
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm, OpenSSL and curl for healthcheck
RUN npm install -g pnpm@9.12.2 \
  && apk add --no-cache openssl curl

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Copy production node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Set ownership
RUN chown -R node:node /app

# Switch to node user
USER node

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Production start command (with Prisma migrations)
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]