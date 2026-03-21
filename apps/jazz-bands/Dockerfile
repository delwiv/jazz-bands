# Multi-stage build for minimal image size (RAM optimization)
# Stage 1: Build
FROM node:24-alpine AS builder

# Install build dependencies for sharp (image optimization)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
ARG BAND_SLUG
ENV BAND_SLUG=${BAND_SLUG}
RUN npm run build

# Stage 2: Production (minimal runtime)
FROM node:24-alpine AS runner

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port (will be set via env var)
EXPOSE 3000

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${process.env.PORT}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the app
CMD ["npm", "run", "start"]
