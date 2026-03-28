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
    // Allow wildcard subdomain access via Traefik
    host: '0.0.0.0',
    allowedHosts: process.env.BAND_SLUG ? [`${process.env.BAND_SLUG}.jazz.wildredbeard.tech`] : ['localhost'],
  },
  build: {
    target: 'esnext',
  },
})
