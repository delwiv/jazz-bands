import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const appDir = join(__dirname, 'app')

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      '~': appDir,
    },
  },
  build: {
    target: 'esnext',
  },
  // Define environment variables for both app and Sanity Studio
  define: {
    'process.env.SANITY_PROJECT_ID': JSON.stringify(process.env.SANITY_PROJECT_ID || '94fpfdn8'),
    'process.env.SANITY_DATASET': JSON.stringify(process.env.SANITY_DATASET || 'production'),
    'process.env.SANITY_API_READ_TOKEN': JSON.stringify(process.env.SANITY_API_READ_TOKEN || ''),
    'process.env.SANITY_API_WRITE_TOKEN': JSON.stringify(process.env.SANITY_API_WRITE_TOKEN || ''),
  },
})
