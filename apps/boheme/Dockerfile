ARG BASE=node:18
ARG PORT=3017

FROM $BASE AS builder

WORKDIR /app

RUN corepack enable yarn

COPY package.json yarn.lock bower.json .bowerrc ./

RUN yarn

COPY client/ ./client/
COPY common/ ./common/
COPY server/ ./server/

RUN yarn build

COPY gulpfile.js makeConfig.js .

EXPOSE $PORT
CMD ["yarn", "start"]
