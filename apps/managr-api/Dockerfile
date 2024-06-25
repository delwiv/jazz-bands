ARG BASE=node:18
ARG PORT=3092

FROM $BASE AS builder

WORKDIR /app

RUN npm i -g pnpm@latest-8

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY src/ ./src/
COPY static/ ./static/
COPY babel.config.js getToken.js credentials.json ./

RUN pnpm build

EXPOSE $PORT

CMD ["pnpm", "start"]
