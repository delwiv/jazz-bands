ARG BASE=node:20
ARG PORT=3017

FROM $BASE AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY ./package.json ./pnpm-lock.yaml ./bower.json ./

RUN pnpm i

COPY client/ ./client/
COPY common/ ./common/
COPY server/ ./server/
COPY gulpfile.js makeConfig.js .

RUN pnpm build

EXPOSE $PORT
CMD ["pnpm", "start"]
