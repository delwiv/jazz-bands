ARG BASE=node:16
ARG PORT=3091

ARG API_URL

FROM $BASE AS builder

WORKDIR /app

RUN npm i -g pnpm@latest-8

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY lib/ ./lib/
COPY pages/ ./pages/
COPY src/ ./src/
COPY static/ ./static

COPY next.config.js ./

EXPOSE $PORT

CMD ["pnpm", "start"]
