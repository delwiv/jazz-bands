# Jazz Bands Platform — AGENTS.md

> **Purpose**: This document provides AI agents and developers with a comprehensive overview of the jazz-bands application architecture, tech stack, features, and development workflow.

---

## 📋 Quick Summary

**Jazz Bands** is a modern SSR application that serves **6 jazz band websites** (boheme, canto, jazzola, swing-family, trio-rsh, west-side-trio) from a single codebase via subdomain routing.

**Tech Stack**: React Router v7 SSR, Sanity CMS, Docker, Traefik, TypeScript, Tailwind CSS

**Key Architecture**:
- **Subdomain-based Multi-tenancy**: Single codebase serves 6 bands via `$subdomain` route parameter
- **Hybrid CMS Schema**: Direct references + band-specific overrides for musician relationships
- **SSR with React Router v7**: SEO-friendly, fast initial load, bot detection
- **Docker Per Band**: Isolation, independent scaling, memory limits for Raspberry Pi 4
- **Traefik for SSL**: Automatic Let's Encrypt certificates via TLS-ALPN-01 challenge
- **Sanity CDN**: Edge caching for better performance, reduced server load

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
│   │       ├── Layout.tsx        # Page layout wrapper
│   │       ├── PageTransition.tsx# Animation wrapper
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

*Last updated: March 2026*
