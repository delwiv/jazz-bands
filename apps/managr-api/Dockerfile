FROM node:24
WORKDIR /app

RUN npm i -g pnpm@latest-8

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY src/ ./src/
COPY credentials.json token.json ./

EXPOSE 3092

CMD ["node", "src/index.js"]
