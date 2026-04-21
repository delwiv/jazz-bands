# ============================================================================
# Stage 1: Builder - Compile React Router SSR app
# ============================================================================
FROM node:24-alpine AS builder

# Install system dependencies for Vite/React build (if native modules needed)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Vite requires VITE_ prefix for client-side environment variables
ARG VITE_SANITY_STUDIO_PROJECT_ID
ARG VITE_SANITY_STUDIO_DATASET
ARG VITE_SANITY_API_READ_TOKEN
ENV VITE_SANITY_STUDIO_PROJECT_ID=$VITE_SANITY_STUDIO_PROJECT_ID
ENV VITE_SANITY_STUDIO_DATASET=$VITE_SANITY_STUDIO_DATASET
ENV VITE_SANITY_API_READ_TOKEN=$VITE_SANITY_API_READ_TOKEN

# Copy package files first (Docker layer caching)
COPY package*.json ./

# Production dependencies only (no dev deps)
RUN npm ci

# Copy source code
COPY . .

# Build to ./dist
RUN npm run build

# ============================================================================
# Stage 2: Runner - Production container (Alpine, ~14MB base)
# ============================================================================
FROM node:24-alpine AS runner

# Create non-root user (best practice, container = 256MB limit for Pi4)
ARG UID=1001
ARG GID=1001
RUN addgroup -g ${GID} -S nodejs && \
  adduser -S nodejs -u ${UID}

WORKDIR /app

# Copy build artifacts from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json .

# Switch to non-root user
USER nodejs

ENV NODE_ENV=production
ENV PORT=5173
ENV NODE_OPTIONS="--max-old-space-size=180"

# Healthcheck using lightweight wget (Alpine native)
# Port 5173 = React Router v7 default, respects PORT env var
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["wget", "--spider", "-q", "http://localhost:5173/"]

# Zero-config production server with @react-router/serve
# 180MB max heap for Pi 4; PORT=5173
CMD ["npm", "start"]
