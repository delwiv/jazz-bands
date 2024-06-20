ARG BASE=node:20
ARG PORT=3045

FROM $BASE AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY ./package.json ./pnpm-lock.yaml ./bower.json ./

RUN pnpm install

COPY client/ ./client/
COPY common/ ./common/
COPY server/ ./server/
COPY gulpfile.js makeConfig.js .

RUN pnpm build

EXPOSE $PORT
CMD ["pnpm", "start"]
