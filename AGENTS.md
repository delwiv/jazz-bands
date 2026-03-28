# Jazz Bands Platform — AGENTS.md

> **Purpose**: This document provides AI agents and developers with a comprehensive overview of the jazz-bands application architecture, tech stack, features, and development workflow.

---

## 📋 Quick Summary

**Jazz Bands** is a modern SSR application that serves **6 jazz band websites** (boheme, canto, jazzola, swing-family, trio-rsh, west-side-trio) from a single codebase via subdomain routing.

**Project Goal**: Migrate 6 legacy Angular band websites (`/apps/boheme`, `/apps/canto`, `/apps/jazzola`, `/apps/swing-family`, `/apps/trio-rsh`, `/apps/west-side-trio`) to a unified modern platform at `/apps/jazz-bands`.

**Tech Stack**: React Router v7 SSR, Sanity CMS, Docker, Traefik, TypeScript, Tailwind CSS

**Key Architecture**:
- **Subdomain-based Multi-tenancy**: Single codebase serves 6 bands via `$subdomain` route parameter
- **Hybrid CMS Schema**: Direct references + band-specific overrides for musician relationships
- **SSR with React Router v7**: SEO-friendly, fast initial load, bot detection
- **Docker Per Band**: Isolation, independent scaling, memory limits for Raspberry Pi 4
- **Traefik for SSL**: Automatic Let's Encrypt certificates via TLS-ALPN-01 challenge
- **Sanity CDN**: Edge caching for better performance, reduced server load

---

## 📊 Migration Status

### Migration Overview

All 6 legacy Angular apps are being ported from `/apps/<bandname>/` to the unified `/apps/jazz-bands/` platform.

**Status by Band**:
| Band | Source | Target | Data Status |
|------|--------|--------|-------------|
| boheme | `/apps/boheme` | `/apps/jazz-bands` (subdomain: boheme) | ✅ Migrated |
| canto | `/apps/canto` | `/apps/jazz-bands` (subdomain: canto) | ✅ Migrated |
| jazzola | `/apps/jazzola` | `/apps/jazz-bands` (subdomain: jazzola) | ✅ Migrated |
| swing-family | `/apps/swing-family` | `/apps/jazz-bands` (subdomain: swing-family) | ✅ Migrated |
| trio-rsh | `/apps/trio-rsh` | `/apps/jazz-bands` (subdomain: trio-rsh) | ✅ Migrated |
| west-side-trio | `/apps/west-side-trio` | `/apps/jazz-bands` (subdomain: west-side-trio) | ✅ Migrated |

### What Has Been Migrates

✅ **Completed**:

1. **Band Documents**: All 6 bands migrated to Sanity CMS as single documents
2. **Musicians**: 10 unique musicians deduplicated and shared across bands
3. **Tour Dates**: All historical tour dates migrated (~288 total across all bands)
4. **Recordings**: 37 audio files migrated with proper metadata
5. **Main Content Images**: Legacy hardcoded images (e.g., boheme's `remy.png`) detected and migrated
6. **Musician Photos**: All musician portraits optimized and imported
7. **Assets**: 41 total assets uploaded to Sanity (optimized JPEGs, MP3s)

📋 **Migration Features**:

- **Smart Deduplication**: Musicians appearing in multiple bands are shared, not duplicated
- **Band-Specific Overrides**: Musician bios/photos can be overridden per band
- **Asset Optimization**: Images converted to JPEG, resized, quality reduced for Sanity
- **Legacy Image Detection**: Scans old HTML templates for hardcoded images not in MongoDB
- **Clean Naming**: Files like `{band}-{type}-{name}.ext` (e.g., `boheme-nova-dream.mp3`)

📊 **Content Statistics**:

| Band | Tour Dates | Recordings | Members |
|------|------------|------------|---------|
| boheme | 125 | 4 | 4 |
| canto | 52 | 5 | 3 |
| jazzola | 15 | 6 | 4 |
| swing-family | 53 | 6 | 4 |
| trio-rsh | 29 | 5 | 3 |
| west-side-trio | 12 | 7 | 3 |
| **Total** | **286** | **33** | **21** |

### How to Run Migration

```bash
# Extract data from MongoDB and optimize assets
export MONGODB_ROOT_PASSWORD='<password>'
cd apps/jazz-bands
npm run extract

# Import to Sanity staging
npm run import staging

# Import to Sanity production
npm run import production
```

### Asset File Naming Convention

All imported assets use clean, searchable naming:
```
{band}-{type}-{name}.{ext}
```

**Examples**:
- `boheme-nova-dream.mp3` (no track number, band context from document)
- `boheme-main-remy.jpg` (main content image)
- `boheme-musician-guillaume-souriau.jpg` (musician photo)

**Why This Naming?**
- Easy to identify assets in Sanity Studio
- Band name in filename helps operators verify correct band association
- No redundant info (track numbers, composers removed)
- Original data preserved in document fields

---

## 🛠️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React Router | v7.13.1 | SSR, routing, data loading |
| **React** | React | v19.0.0 | UI library |
| **Language** | TypeScript | v5.6.3 | Type safety |
| **Styling** | Tailwind CSS | v3.4.14 | Utility-first CSS |
| **Build Tool** | Vite | v7.0.0 | Fast HMR, bundling |
| **CMS** | Sanity | v6.23.0 | Content management |
| **Audio** | Howler.js | v2.2.4 | Audio playback |
| **Drag & Drop** | dnd-kit | v6.3.1 | Queue reordering |
| **Animations** | framer-motion | v12.36.0 | Page/player animations |
| **Linter** | Biome | v2.4.6 | Fast linting/formatting |
| **Deployment** | Docker | latest | Containerization |
| **Proxy** | Traefik | latest | SSL, routing |



---

## 📁 Directory Structure

```
apps/jazz-bands/
├── app/
│   ├── entry.client.tsx      # Client-side hydration
│   ├── entry.server.tsx      # SSR entry with bot detection
│   ├── root.tsx              # Root layout, subdomain extraction
│   ├── routes.ts             # Route configuration
│   ├── tailwind.css          # Global styles
│   ├── routes/
│   │   ├── index.tsx         # Landing page
│   │   ├── sitemap.xml.tsx   # Dynamic sitemap generator
│   │   ├── robots.txt.tsx    # Robots file
│   │   ├── __catchall.tsx    # 404 handler
│   │   └── $subdomain/       # Band-specific routes
│   │       ├── index.tsx     # Band home page
│   │       ├── musicians.tsx # Band members
│   │       ├── tour.tsx      # Tour dates
│   │       ├── music.tsx     # Audio player page
│   │       └── contact.tsx   # Contact form
│   ├── components/
│   │   ├── audio/
│   │   │   └── StickyPlayer.tsx  # Audio player UI
│   │   ├── StructuredData.tsx    # SEO schema injection
│   │   └── shared/
│   │       ├── Header.tsx        # Navigation
│   │       ├── Footer.tsx        # Footer
│   │       ├── Layout.tsx        # Page layout wrapper (with AnimatePresence, handles page transitions)
│   │       ├── Skeleton.tsx      # Loading placeholder
│   │       └── ErrorBoundary.tsx # Error handling
│   ├── contexts/
│   │   └── AudioContext.tsx      # Audio player state management
│   ├── lib/
│   │   ├── sanity.client.ts      # Browser Sanity client
│   │   ├── sanity.server.ts      # Server Sanity client
│   │   ├── groq-queries.ts       # GROQ query helpers
│   │   ├── content.service.ts    # Content fetching service
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── routes.types.ts       # Route loader type definitions
│   │   └── animationVariants.ts  # framer-motion configs
│   └── hooks/
│       └── useReducedMotion.ts   # Accessibility hook
├── sanity/
│   ├── schemas/
│   │   ├── index.ts              # Schema registration
│   │   ├── band.ts               # Band document type
│   │   ├── musician.ts           # Musician document type
│   │   ├── recording.ts          # Recording object type
│   │   ├── tourDate.ts           # TourDate object type
│   │   └── bandMemberOverride.ts # Override schema
│   ├── sanity.config.ts          # Sanity Studio config
│   └── SCHEMA-DESIGN.md          # Architecture docs
├── migration/                    # MongoDB → Sanity scripts
├── docker-compose.yml            # 6 band containers + Traefik
├── Dockerfile                    # Node.js Alpine image
├── package.json                  # Dependencies
├── vite.config.ts                # Vite configuration
├── react-router.config.ts        # React Router config
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.mjs            # PostCSS config
├── biome.json                    # Biome linter config
├── tsconfig.json                 # TypeScript config
├── .env.example                  # Environment template
├── DEPLOYMENT.md                 # Deployment guide
├── RAM-OPTIMIZATION.md           # Memory tuning docs
└── CONFIG-NOTES.md               # Config documentation
```

---

## 🗄️ Database Schema (Sanity CMS)

### Document Types

#### `band` (Document)
Main band entity containing all content for a single band.

```typescript
interface Band {
  _id: string;
  name: string;
  slug: string;                    // Unique identifier (boheme, canto, etc.)
  description: Array<PortableText>;
  logo: Image;
  heroImage: Image;
  members: Array<{ _ref: string; _type: 'reference' }>;  // References to musicians
  bandMembers: Array<{
    _key: string;
    musician: { _ref: string; _type: 'reference' };
    bio?: Array<PortableText>;     // Optional override
    image?: Image;                 // Optional override
    instrument?: string;           // Optional override
    _type: 'bandMember';
  }>;
  tourDates: Array<TourDate>;
  recordings: Array<Recording>;
  contact: {
    email: string;
    socialMedia: SocialLinks;
  };
  branding: BrandingColors;
  seo: SEOFields;
}
```

#### `musician` (Document)
Shared musician entity that can be referenced by multiple bands.

```typescript
interface Musician {
  _id: string;
  name: string;
  slug: string;
  bio: Array<PortableText>;
  instrument: string;
  images: Array<Image>;
  bands: Array<{ _ref: string; _type: 'reference' }>;  // Bands this musician belongs to
  bandOverrides: Array<{
    _key: string;
    band: { _ref: string; _type: 'reference' };
    bio?: Array<PortableText>;
    image?: Image;
    instrument?: string;
  }>;
}
```

#### `recording` (Object)
Audio recording embedded in band documents.

```typescript
interface Recording {
  _key: string;
  title: string;
  audio: File;                     // Uploaded audio file
  duration: string;                // Human-readable (e.g., "3:45")
  album?: string;
  releaseYear?: number;
  description?: Array<PortableText>;
  downloadEnabled: boolean;
}
```

#### `tourDate` (Object)
Tour date embedded in band documents.

```typescript
interface TourDate {
  _key: string;
  date: string;                    // ISO date
  city: string;
  venue: string;
  region?: string;
  details?: Array<PortableText>;
  ticketsUrl?: string;
  soldOut: boolean;
}
```

### Hybrid Schema Design

The schema uses a **hybrid approach** for musician-band relationships:

1. **Direct References**: For musicians with consistent info across bands
2. **Band-Specific Overrides**: For musicians who play different instruments or have different bios per band

See `apps/jazz-bands/sanity/SCHEMA-DESIGN.md` for detailed rationale.

---

## 🎯 Key Features

### 1. Subdomain-Based Routing

Single codebase serves 6 bands via subdomain detection:

```typescript
// app/root.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const host = new URL(request.url).hostname;
  const subdomain = host.split('.')[0];  // "boheme" from boheme.jazzbands.com
  
  return { subdomain, origin: new URL(request.url).origin };
}
```

Routes: `$subdomain/`, `$subdomain/musicians`, `$subdomain/tour`, `$subdomain/music`, `$subdomain/contact`

### 2. Audio Player

Sticky audio player with advanced features:

- **Queue Management**: Add/remove recordings from playlist
- **Drag-and-Drop**: Reorder queue using dnd-kit
- **Keyboard Shortcuts**: Space (play/pause), Arrow keys (seek)
- **Persistent State**: Queue survives page navigation
- **Accessibility**: Reduced motion support, ARIA labels

Files: `app/contexts/AudioContext.tsx`, `app/components/audio/StickyPlayer.tsx`

### 3. SEO Optimization

- **Meta Tags**: Dynamic title/description per page
- **Open Graph**: Facebook/LinkedIn sharing
- **Twitter Cards**: Twitter sharing
- **Schema.org**: Structured data (MusicGroup, Musician, MusicRecording)
- **Sitemap**: Dynamic XML sitemap generation
- **Robots.txt**: Customizable crawl rules

### 4. Content Management (Sanity CMS)

- **Real-time Preview**: Live preview of content changes
- **Image Optimization**: Automatic transformation via Sanity URL API
- **CDN Caching**: Edge caching for global performance
- **Versioning**: Built-in version history and publishing workflow

### 5. Accessibility

- **Reduced Motion**: Respects user's `prefers-reduced-motion` setting
- **Semantic HTML**: Proper heading hierarchy, ARIA labels
- **Keyboard Navigation**: Full keyboard support for audio player
- **Color Contrast**: WCAG AA compliant color palette

---

## 🚀 Deployment

### Environment Variables

Required variables (see `.env.example`):

```bash
# Sanity CMS
SANITY_PROJECT_ID=94fpfdn8
SANITY_DATASET=production
SANITY_API_READ_TOKEN=<token>
SANITY_API_WRITE_TOKEN=<token>

# Server
PORT=3000
NODE_ENV=production
```

### Docker Deployment

```bash
# Start all 6 band containers + Traefik
cd apps/jazz-bands
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down
```

### Traefik Configuration

Automatic SSL via Let's Encrypt:

```yaml
# docker-compose.yml (apps/jazz-bands)
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.boheme.rule=Host(`boheme.jazzbands.com`)"
  - "traefik.http.services.boheme.loadbalancer.server.port=3000"
  - "traefik.http.routers.boheme.tls=true"
  - "traefik.http.routers.boheme.tls.certresolver=letsencrypt"
```

### Raspberry Pi 4 Optimization

See `RAM-OPTIMIZATION.md` for detailed memory tuning:

- **Container Limits**: 256MB memory per band container
- **Swap Configuration**: 2GB swap file + zRAM
- **Monitoring**: Regular memory usage checks

---

## 🧑‍💻 Development

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- Sanity CLI (`npm install -g @sanity/cli`)

### Local Development

```bash
# Start the app
cd apps/jazz-bands
npm install
npm run dev

# Start Sanity Studio
npm run studio:dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run typecheck
```

### Sanity Studio

```bash
# Start studio locally
cd apps/jazz-bands/sanity
sanity dev

# Login to Sanity
sanity login

# Publish content to production
sanity dataset create production
```

### Migration from MongoDB

Migration scripts in `apps/jazz-bands/migration/`:

```bash
# Run migration
node migration/migrate.mjs
```

---



## 🔧 Build & Tooling

### React Router v7

- **File-based routing**: `app/routes.ts` defines route structure
- **Data loading**: `loader()` functions for server-side data fetching
- **Meta tags**: `meta()` functions for SEO
- **Type-safe routes**: Automatic type generation in `app/+types/`

### Vite

- **Fast HMR**: Instant updates during development
- **ESBuild**: Fast bundling
- **CSS Features**: CSS modules, Tailwind integration

### Biome

Replaces ESLint + Prettier:

- **Single Tool**: Linting + formatting
- **Fast**: Written in Rust
- **Config**: `biome.json`

### TypeScript

- **Strict Mode**: Full type checking
- **Path Aliases**: `@/` for app directory
- **Route Types**: Auto-generated from route structure

---

## 📝 Common Tasks

### Add a New Band

1. Create band document in Sanity CMS
2. Set slug (e.g., "newband")
3. Add band container to `docker-compose.yml`
4. Configure Traefik routing
5. Deploy: `docker-compose up -d newband`

### Add a New Musician

1. Create musician document in Sanity
2. Add to band's `members` array
3. Optionally add band-specific overrides

### Add a New Recording

1. Upload audio file in Sanity
2. Add to band's `recordings` array
3. Set title, duration, album, download settings

### Update Tour Dates

1. Edit band document in Sanity
2. Add/edit tour dates in `tourDates` array
3. Publish changes

---

## 🔒 Security

- **Environment Variables**: Never commit `.env` files
- **Sanity Tokens**: Use read tokens for client, write tokens for server only
- **CORS**: Configured per-environment
- **Input Validation**: Sanity schema validation

---

## 📚 Additional Documentation

- `apps/jazz-bands/DEPLOYMENT.md`: Detailed deployment guide
- `apps/jazz-bands/RAM-OPTIMIZATION.md`: Memory tuning for Raspberry Pi
- `apps/jazz-bands/sanity/SCHEMA-DESIGN.md`: CMS architecture decisions
- `apps/jazz-bands/CONFIG-NOTES.md`: React Router v7 configuration notes

---

## 🆘 Troubleshooting

### Common Issues

**"Cannot find module" errors**: Run `npm run build` first

**Sanity connection failed**: Check `SANITY_API_READ_TOKEN` in `.env`

**Docker container won't start**: Check `docker-compose logs {service}`

**SSL certificate errors**: Wait for Let's Encrypt auto-renewal (check Traefik logs)

**Memory issues on Pi 4**: Increase swap, reduce container memory limits

---

## 📞 Support

For questions or issues:

1. Check existing documentation in this repo
2. Review Sanity CMS documentation
3. Check React Router v7 docs
4. Contact the development team

---

## 🔄 Migration Workflow

### Commands

```bash
# Extract data from MongoDB and optimize assets
npm run extract

# Import into Sanity (choose dataset)
npm run import staging      # Import to staging dataset
npm run import production   # Import to production dataset
```

### What Extract Does

1. **Cleans previous output**: Removes `./migration/output` directory
2. **Extracts from MongoDB**: Fetches musicians, tour dates, recordings
3. **Optimizes images**: Converts to JPEG, resizes, reduces quality for Sanity
4. **Deduplicates musicians**: Merges duplicate entries across bands
5. **Creates asset documents**: Generates proper Sanity asset references
6. **Outputs NDJSON**: Formats data for Sanity import

### What Import Does

1. **Validates NDJSON**: Checks file format
2. **Creates assets**: Uploads audio/images to Sanity and creates asset documents
3. **Creates documents**: Imports bands, musicians with proper references
4. **Resolves references**: Links documents to uploaded assets

### Environment Variables

**For extract:**
```bash
MONGODB_URI=mongodb://...
# Or:
MONGODB_HOST=localhost
MONGODB_ROOT_PASSWORD=...
```

**For import:**
```bash
SANITY_API_WRITE_TOKEN=your-token-here
# Or:
SANITY_IMPORT_TOKEN=your-token-here
```

### Gallery Images Migration (Updated March 2026)

The migration now properly handles three types of images:

1. **Background Images** (`backgroundImage` field): Fixed you `bg.jpg` or `background.jpg` from storage
2. **Content Images** (`contentImages` field): Main page images like `remy.png` or `main.png`
3. **Gallery Images** (`images` field): Group photos, posters, event photos (NEW: now migrated!)

**What Changed**:
- **Fixed `_key` missing warnings**: Changed `contentImages` from `_sanityAsset: "..."` shorthand to proper `asset: { _sanityAsset: "..." }` wrapper structure
- **Gallery images now populated**: `scanBandImages()` function now called in `migrateBand()`, discovering 188+ images across all bands
- **Proper asset references**: Gallery images use `asset: { _type: "reference", _ref: "..." }` pattern matching musician images

**Verification**: Run `node migration/__tests__/verify-output.mjs` after extraction to validate NDJSON structure.

**Results by Band**:
| Band | Content Images | Gallery Images |
|------|---------------|----------------|
| boheme | 1 | 54 |
| canto | 0 | 47 |
| jazzola | 1 | 28 |
| swing-family | 1 | 24 |
| trio-rsh | 1 | 12 |
| west-side-trio | 1 | 23 |

---

## 🤖 AI Agent Guidelines

### Development Environment

- **Dev server**: Launched by the user, **do not restart or kill it**. The user manages the development server lifecycle.
- **Hot Reloading**: Vite/React Router provides automatic hot module replacement (HMR) on file system changes. **Files are automatically reloaded when edited** — no manual restart needed.
- **Logs**: Monitor logs in `/tmp/opencode` folder when debugging issues.
- **Single developer**: You are the only developer on this project. No team coordination needed.

### Git & Commits

**CRITICAL COMMIT WORKFLOW:**

- **DO NOT COMMIT**: You must NEVER automatically commit code changes. Committing is the developer's responsibility.
- **PROMPT USER TO COMMIT**: After completing any significant updates (feature completion, bug fixes, refactoring), you must:
  1. **Notify the user** that changes are complete
  2. **Provide a commit message suggestion** (semantic style)
  3. **Ask if they want to commit** the changes
  4. **Wait for explicit approval** before proceeding

**Example commit prompt:**
```
✅ Changes complete. Ready to commit?

Suggested commit message:
"feat: add type-safe route loaders and clean up redundant animations"

Files modified: [list]

Would you like me to stage and commit these changes?
```

- **Commit style**: Use semantic commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.) in English.
- **No author attribution**: Do **not** add co-author, "Ultraworked with", or similar attribution lines in commit messages.
- **Interactive rebase**: Safety rules block destructive git commands. User will handle `git rebase -i` and commit rewriting manually.
- **Markdown files**: Do **not** commit agent-generated markdown files (e.g., `MIGRATION-CHANGES.md`, task summaries). Only `README.md` and `AGENTS.md` are tracked. These files pollute the repo and should remain in `.gitignore`.

### Code Quality Standards

- **Type Safety**: Create proper TypeScript interfaces for route loaders (use `app/lib/routes.types.ts` pattern). Avoid `as any` casts.
- **Animation Architecture**: Layout component handles page transitions. Routes should NOT add redundant `initial/{{ opacity: 0, y: 20 }}` animations — they duplicate what Layout already does.
- **Reduced Motion**: Import `useReducedMotion` hook only when actually needed (e.g., for parallax/scroll effects). Remove unused imports.
- **Type Annotations**: Use explicit types for collections (e.g., `TourDate` for tour data filtering/sorting).

### Recent Changes (March 2026)

**Code Cleanup Completed:**
- Created `app/lib/routes.types.ts` with type-safe route loader interfaces
- Removed unused `useReducedMotion` imports from contact, musicians, and tour routes
- Removed redundant page-entry animation props (5 instances across 4 routes)
- Replaced all `as any` casts with proper TypeScript types in route loaders
- Fixed 5 `any` type annotations in tour date filtering functions

### General

- **Verify before acting**: When in doubt about scope or approach, ask clarifying questions.
- **Match existing patterns**: Follow established codebase conventions when making changes.
- **Minimal changes**: Prefer small, focused changes over large refactors unless explicitly requested.

---

*Last updated: March 2026 (post-code-cleanup)*
