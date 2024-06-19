ARG BASE=node:20
ARG PORT=3017

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

# FROM builder AS tester
# COPY tests ./tests
# RUN npm install
# COPY .env.test .env.test
# ENV TBD_ENV test
# CMD ["npm", "test"]

# FROM $BASE AS runner
# ARG TBD_ENV
# ENV TBD_ENV=$TBD_ENV
# WORKDIR /app
# COPY --from=builder /app ./
# COPY .env.docker ./.env
EXPOSE $PORT
CMD ["pnpm", "start"]
