# ============================================================================
# Stage 1: Builder - Compile React Router SSR app
# ============================================================================
FROM node:24-slim AS builder

# Install build dependencies (Debian slim, not Alpine—better ARM64 natively)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package*.json ./

# Production dependencies only (no dev deps)
RUN npm ci

# Copy source code
COPY . .

# Build to ./build
RUN npm run build

# ============================================================================
# Stage 2: Runner - Production container (Debian slim, ~140MB base)
# ============================================================================
FROM node:24-slim AS runner

WORKDIR /app

# Copy build artifacts from builder stage (as root, then chown to node)
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json .
COPY --from=builder /app/server.js .
RUN chown -R node:node /app

# Drop privileges (node-slim uses 'node' user/group)
USER node

ENV NODE_ENV=production
ENV PORT=5174
ENV NODE_OPTIONS="--max-old-space-size=180"

# Healthcheck — lightweight endpoint, no SSR / no Sanity call
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:5174/__health',function(r){process.exit(r.statusCode===200?0:1)})"]

# Custom production server with Sanity proxy cache + purge endpoint
CMD ["node", "server.js"]
