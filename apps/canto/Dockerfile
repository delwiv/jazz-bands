ARG BASE=node:20
ARG PORT=3045

FROM $BASE AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml bower.json .bowerrc ./

RUN pnpm install

COPY client/ ./client/
COPY common/ ./common/
COPY server/ ./server/

RUN pnpm build

COPY gulpfile.js makeConfig.js .

EXPOSE $PORT
CMD ["pnpm", "start"]
