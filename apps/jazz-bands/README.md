# Jazz Bands - Development Guide

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 24+ (for running Sanity Studio locally)
- Sanity CLI: `npm install -g @sanity/ccli`

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   SANITY_STUDIO_PROJECT_ID=your-project-id
   SANITY_STUDIO_DATASET=staging  # or production
   SANITY_API_READ_TOKEN=your-read-token
   SANITY_API_WRITE_TOKEN=your-write-token
   ```

### Start Dev Stack

```bash
# Start all 6 band containers
npm run dev:docker

# Or directly:
docker-compose -f docker-compose.dev.yml up -d
```

### Sanity Studio (Run Locally)

```bash
# In a separate terminal, run Sanity Studio locally
npm run dev:studio
```

Sanity Studio will be available at: `http://localhost:3333`

## Band Services

Each band runs on its own port for easy development:

| Band | Port | URL |
|------|------|-----|
| boheme | 3001 | http://localhost:3001 |
| canto | 3002 | http://localhost:3002 |
| jazzola | 3003 | http://localhost:3003 |
| swing-family | 3004 | http://localhost:3004 |
| trio-rsh | 3005 | http://localhost:3005 |
| west-side-trio | 3006 | http://localhost:3006 |

## Development Workflow

### 1. Make code changes
Edit files in `apps/jazz-bands/app/`

### 2. Changes auto-reload
Hot-reload is enabled via volume mounts. Refresh your browser to see changes.

### 3. Check logs
```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific band
docker-compose -f docker-compose.dev.yml logs -f boheme
```

### 4. Restart specific service
```bash
docker-compose -f docker-compose.dev.yml restart boheme
```

## Stop Dev Stack

```bash
npm run dev:down

# Or directly:
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Containers not starting

1. Check `.env` file exists and has all required variables
2. View logs: `docker-compose -f docker-compose.dev.yml logs boheme`

### "Cannot find module" errors

Run `npm ci` in the container:
```bash
docker-compose -f docker-compose.dev.yml exec boheme npm ci
docker-compose -f docker-compose.dev.yml restart boheme
```

### Sanity connection errors

1. Verify `SANITY_API_READ_TOKEN` and `SANITY_API_WRITE_TOKEN` in `.env`
2. Check Sanity dashboard for token validity

### Port already in use

If port 3001-3006 is in use:
```bash
# Check what's using the port
lsof -i :3001

# Stop the process or change the port in docker-compose.dev.yml
```

## Development Architecture

### Docker Compose `env_file:`

The `env_file: .env` directive in `docker-compose.dev.yml` automatically loads all environment variables from `.env` into each container. No need to manually map each variable.

### Hot-Reload Volume Mounts

Key volumes mounted for hot-reload:
```yaml
volumes:
  - ./app:/app/app           # Source code (auto-reload)
  - ./vite.config.ts         # Vite config
  - ./react-router.config.ts # Router config
  - ./tsconfig.json          # TypeScript config
  - ./.env:/app/.env         # Environment variables
```

### Sanity Studio

Sanity Studio runs **outside Docker** on your local machine for:
- Faster startup
- Direct access to your filesystem
- Better debugging experience

## NPM Scripts

| Script | Description |
|--------|-------------|
| `dev:app` | Start a single band (react-router dev) |
| `dev:studio` | Start Sanity Studio locally |
| `dev:docker` | Start all 6 band containers |
| `dev:down` | Stop all dev containers |
| `build` | Build for production |
| `start` | Start production server |
| `lint` | Run Biome linter |
| `typecheck` | Run TypeScript checker |

## Additional Resources

- [AGENTS.md](../AGENTS.md) - Application architecture overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [RAM-OPTIMIZATION.md](./RAM-OPTIMIZATION.md) - Memory tuning for Raspberry Pi
