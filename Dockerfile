# Stage 1: Build the application
FROM node:20-slim AS builder
WORKDIR /app

# Install build essentials for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies (including devDependencies needed for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and config files
COPY . .

# Provide a dummy DATABASE_URL so prisma generate can parse the config
ENV DATABASE_URL="file:/app/data/dev.db"

# Generate Prisma client from schema
RUN npx prisma generate

# Build Next.js (standalone output mode)
RUN npm run build

# Stage 2: Production runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output (includes all bundled JS deps)
COPY --from=builder /app/.next/standalone ./

# Copy static assets (served by Next.js at /_next/static)
COPY --from=builder /app/.next/static ./.next/static

# Copy public files
COPY --from=builder /app/public ./public

# Copy native module that cannot be bundled (better-sqlite3 .node binary)
# Note: Prisma 7.x generates client to src/generated/prisma/, not node_modules/.prisma/
# @prisma/client is pure JS and is bundled by Next.js standalone output
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Copy Prisma CLI and client for runtime db push
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema and config (needed for runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Create data directory for SQLite database persistence
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check: verify the app responds on port 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
