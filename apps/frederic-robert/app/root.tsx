import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import type { Route } from './+types/root'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { loadHub } from './lib/loaders'
import './tailwind.css'

export async function loader({ request }: Route.LoaderArgs) {
  const { person, baseUrl } = await loadHub(request)

  return {
    person,
    baseUrl,
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || '',
    sanityProjectId: process.env.SANITY_PROJECT_ID || '',
    sanityDataset: process.env.SANITY_DATASET || '',
  }
}

export function meta({ data }: Route.MetaArgs) {
  const personName = data?.person?.name || 'Frédéric Robert'
  return [
    { charset: 'utf-8' },
    { title: `${personName} — Batteur de Jazz` },
    {
      name: 'description',
      content:
        'Frédéric Robert, batteur de jazz et manager de groupes : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio.',
    },
    {
      tagName: 'link',
      rel: 'icon',
      type: 'image/png',
      sizes: '192x192',
      href: '/logo-192.png',
    },
    {
      tagName: 'link',
      rel: 'apple-touch-icon',
      sizes: '192x192',
      href: '/logo-192.png',
    },
  ]
}

export default function App() {
  const { person, umamiWebsiteId, sanityProjectId, sanityDataset } =
    useLoaderData<typeof loader>()

  return (
    <html lang="fr">
      <head>
        <Meta />
        <Links />
        <meta name="sanity-project-id" content={sanityProjectId} />
        <meta name="sanity-dataset" content={sanityDataset} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {umamiWebsiteId && (
          <script
            src="https://analytics.jazz.wildredbeard.tech/script.js"
            data-website-id={umamiWebsiteId}
            defer
          />
        )}
      </head>
      <body>
        <Header personName={person.name} />
        <main>
          <Outlet />
        </main>
        <Footer personName={person.name} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
