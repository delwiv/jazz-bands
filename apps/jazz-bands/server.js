import express from 'express';
import { createRequestHandler } from '@react-router/express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const build = await import('./build/server/index.js');
  const buildDirectory = new URL('./build/', import.meta.url).pathname;

  const app = express();
  app.all(
    '*',
    createRequestHandler({
      build: build,
      buildDirectory: buildDirectory,
      mode: process.env.NODE_ENV,
    }),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  try {
    app.listen(port, () => {
      console.log(`Now listening on port ${port}!`);
    });
  } catch (error) {
    console.error(`Unable to start server on port ${port}:`, error);
    process.exit(1);
  }
}

start().catch(console.error);
