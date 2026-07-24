# Jazz Bands

[![Build and Push Jazz Bands](https://github.com/delwiv/jazz-bands/actions/workflows/build-and-push.yml/badge.svg)](https://github.com/delwiv/jazz-bands/actions/workflows/build-and-push.yml)

6 jazz band websites served from a single monorepo.

## Architecture

| Stack | Stack | Location |
|-------|-------|----------|
| **Legacy** | Angular + LoopBack + MongoDB | `apps/boheme`, `apps/canto`, … |
| **Jazzbands** (new) | React Router v7 SSR + Sanity CMS | `apps/jazz-bands` |

### Legacy Stack

6 Angular apps on `node:20` with MongoDB and Valkey.

```bash
docker compose -f docker-compose.yml up -d
```

### Jazzbands Stack

Single SSR codebase, subdomain-routed per band via Traefik + nginx. Content managed in Sanity CMS.

```bash
docker compose -f docker-compose.jazzbands.yml up -d
```

### Production (Raspberry Pi 4)

Both stacks run side-by-side with isolated Docker Compose projects.

```bash
# Legacy
docker compose -p legacy up -d

# Jazzbands
docker compose -f docker-compose.jazzbands.yml -p jazzbands up -d
```

## Domains

| Stack | Domain |
|-------|--------|
| Legacy | `boheme-jazz.com`, `canto-jazz.com`, … |
| Jazzbands | `boheme.jazz.wildredbeard.tech`, `canto.jazz.wildredbeard.tech`, … |

## Development

See `apps/jazz-bands/README.md` for the new stack dev workflow.
