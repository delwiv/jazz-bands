import { Rocket, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useClient } from 'sanity'
import { SANITY_PURGE_DOMAIN, SANITY_API_READ_TOKEN } from '../lib/sanity-settings'

interface BandResult {
  slug: string
  status: 'pending' | 'ok' | 'error'
  error?: string
}

export default function PurgeTool() {
  const client = useClient({ apiVersion: '2025-01-10' })
  const [results, setResults] = useState<BandResult[]>([])
  const [purging, setPurging] = useState(false)

  const purge = useCallback(async () => {
    setPurging(true)

    if (!SANITY_PURGE_DOMAIN) {
      setResults([{ slug: 'config', status: 'error', error: 'SANITY_STUDIO_PURGE_DOMAIN not set' }])
      setPurging(false)
      return
    }

    const bands = await client.fetch<{ slug: { current: string } }[]>('*[_type == "band" && defined(slug.current)]{slug}')

    const entries: BandResult[] = bands.map((b) => ({
      slug: b.slug.current,
      status: 'pending' as const,
    }))
    setResults(entries)

    for (const entry of entries) {
      const url = `https://${entry.slug}.${SANITY_PURGE_DOMAIN}/__purge`
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(SANITY_API_READ_TOKEN ? { 'x-purge-token': SANITY_API_READ_TOKEN } : {}),
          },
        })
        entry.status = res.ok ? 'ok' : 'error'
        if (!res.ok) entry.error = `${res.status} ${res.statusText}`
      } catch (err) {
        entry.status = 'error'
        entry.error = err instanceof Error ? err.message : 'Unknown error'
      }
      setResults([...entries])
    }

    setPurging(false)
  }, [client])

  const okCount = results.filter((r) => r.status === 'ok').length

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Purge des caches
      </h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Supprime le cache des appels API Sanity sur chaque serveur de l'application.
      </p>

      <button
        type="button"
        disabled={purging}
        onClick={purge}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: '#e53e3e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '1rem',
          fontWeight: 500,
          cursor: purging ? 'not-allowed' : 'pointer',
          opacity: purging ? 0.6 : 1,
        }}
      >
        {purging ? <Rocket size={18} /> : <Trash2 size={18} />}
        {purging ? 'Purge en cours...' : 'Purger tous les caches'}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>
            {okCount}/{results.length} serveurs purgés
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.map((r) => (
              <li
                key={r.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: r.status === 'pending' ? '#ccc' : r.status === 'ok' ? '#38a169' : '#e53e3e',
                    flexShrink: 0,
                  }}
                />
                <strong>{r.slug}</strong>
                {r.status === 'pending' && <span style={{ color: '#999' }}>...</span>}
                {r.status === 'ok' && <span style={{ color: '#38a169' }}>OK</span>}
                {r.status === 'error' && (
                  <span style={{ color: '#e53e3e', fontSize: '0.875rem' }}>{r.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!SANITY_PURGE_DOMAIN && (
        <p style={{ marginTop: '1.5rem', color: '#e53e3e', fontSize: '0.875rem' }}>
          SANITY_STUDIO_PURGE_DOMAIN n'est pas configuré. Définissez-le dans votre
          environnement de build (ex: jazz.wildredbeard.tech).
        </p>
      )}
    </div>
  )
}
