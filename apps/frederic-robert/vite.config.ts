import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const appDir = join(__dirname, 'app')

export default defineConfig({
  plugins: [reactRouter(), tailwindcss()],
  resolve: {
    alias: {
      '~': appDir,
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    // Proxy /sanity/* to the shared Sanity API in dev (same project as jazz-bands)
    proxy: {
      '/sanity': {
        target: 'https://94fpfdn8.api.sanity.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sanity/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
  },
})
