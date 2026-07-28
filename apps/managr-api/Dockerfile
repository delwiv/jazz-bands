FROM node:24
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src/ ./src/
COPY credentials.json token.json ./

EXPOSE 3092

CMD ["node", "src/index.js"]
