# Multi-stage build
FROM node:24-slim AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BAND_SLUG
ENV BAND_SLUG=${BAND_SLUG}
ARG UMAMI_WEBSITE_ID
ENV UMAMI_WEBSITE_ID=${UMAMI_WEBSITE_ID}
RUN npm run build

# Production runtime
FROM node:24-slim AS runner

ARG UID=1001
ARG GID=1001
RUN addgroup -g ${GID} -S nodejs && \
    adduser -S nodejs -u ${UID}

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Switch to non-root user
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${process.env.PORT}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npm", "run", "start"]
