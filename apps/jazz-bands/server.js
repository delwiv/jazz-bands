import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequestHandler } from '@react-router/express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Sanity proxy cache ---
const CACHE_TTL = 3600_000 // 1 hour (content changes are rare)
const proxyCache = new Map()

function cacheKey(req) {
  return `${req.method}:${req.originalUrl}`
}

async function proxyToSanity(req, res) {
  const projectId = process.env.SANITY_PROJECT_ID
  if (!projectId) {
    return res.status(500).json({ error: 'SANITY_PROJECT_ID not set' })
  }

  const key = cacheKey(req)
  const cached = proxyCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.set('X-Cache', 'HIT')
    console.log('[sanity-proxy] HIT', req.originalUrl.slice(0, 80))
    return res.status(cached.status).set(cached.headers).send(cached.body)
  }

  const targetPath = req.originalUrl.replace(/^\/sanity/, '')
  const targetUrl = `https://${projectId}.api.sanity.io${targetPath}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] || 'application/json',
        ...(process.env.SANITY_API_READ_TOKEN
          ? { authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` }
          : {}),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const body = await response.text()
    const headers = {}
    for (const [k, v] of response.headers) {
      if (k === 'content-encoding' || k === 'transfer-encoding' || k === 'content-length') continue
      headers[k] = v
    }

    if (req.method === 'GET' && response.status === 200) {
      proxyCache.set(key, { body, status: response.status, headers, timestamp: Date.now() })
      console.log('[sanity-proxy] MISS cached', req.originalUrl.slice(0, 60))
      if (proxyCache.size > 100) {
        const first = proxyCache.entries().next().value
        if (first) proxyCache.delete(first[0])
      }
    } else {
      console.log('[sanity-proxy] MISS (no cache)', req.method, response.status, req.originalUrl.slice(0, 40))
    }

    res.set('X-Cache', 'MISS')
    res.status(response.status).set(headers).send(body)
  } catch (err) {
    console.error('[sanity-proxy] ERROR', err.message)
    res.status(502).json({ error: 'Proxy fetch failed' })
  }
}
// ---

const build = await import('./build/server/index.js')
const buildDirectory = path.resolve(__dirname, 'build')
const app = express()

app.disable('x-powered-by')
app.use(compression())
app.use(morgan('tiny'))

// Serve static assets (immutable cache for hashed files)
app.use(
  '/assets',
  express.static(path.join(buildDirectory, 'client', 'assets'), { immutable: true, maxAge: '1y' }),
)
app.use(express.static(path.join(buildDirectory, 'client')))
app.use(express.static('public', { maxAge: '1h' }))

// Sanity API Proxy: /sanity/* → https://{projectId}.api.sanity.io/*
app.use('/sanity', proxyToSanity)

// Healthcheck (no SSR, no Sanity call — fast)
app.use('/__health', (_req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.status(200).type('text/plain').send('ok')
})

// Cache purge endpoint (POST)
app.use('/__purge', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-purge-token')
  if (req.method === 'OPTIONS') return res.sendStatus(200)

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const purgeToken = process.env.SANITY_PURGE_TOKEN
  if (purgeToken && req.headers['x-purge-token'] !== purgeToken) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const count = proxyCache.size
  proxyCache.clear()
  console.log(`[sanity-proxy] PURGED ${count} entries (token=${purgeToken ? 'yes' : 'no'})`)

  res.json({ ok: true, purged: count })
})

// React Router SSR handler
app.all(
  '*',
  createRequestHandler({
    build,
    buildDirectory,
    mode: process.env.NODE_ENV,
  }),
)

const port = process.env.PORT ? Number(process.env.PORT) : 3000
app.listen(port, () => {
  console.log(`Now listening on http://localhost:${port}`)
  if (process.env.SANITY_PROXY_URL) {
    console.log(`[sanity-proxy] ACTIVE → ${process.env.SANITY_PROXY_URL}`)
    console.log(`[sanity-proxy] TTL=${CACHE_TTL / 1000}s | purge-token=${process.env.SANITY_PURGE_TOKEN ? 'set' : 'NOT SET'}`)
    // Log cache size every 10 minutes
    setInterval(() => {
      console.log(`[sanity-proxy] cache entries: ${proxyCache.size}`)
    }, 600_000)
  }
})
