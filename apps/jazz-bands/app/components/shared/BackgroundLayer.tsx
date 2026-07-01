import type { ReactNode } from 'react'

interface BackgroundLayerProps {
  backgroundImage?: string | null
  skipToContent?: boolean
  children?: ReactNode
}

export function BackgroundLayer({
  backgroundImage,
  skipToContent = false,
  children,
}: BackgroundLayerProps) {
  return (
    <>
      {backgroundImage ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundPosition: 'center top',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 z-0" />
      )}
      <div className="fixed inset-0 bg-slate-950/50 z-0" />
      {skipToContent && (
        <a
          href="#main-content"
          className="skip-to-content absolute top-0 left-0 z-50 -translate-y-full bg-blue-600 text-white px-4 py-2 transition-transform focus:translate-y-0"
        >
          Skip to main content
        </a>
      )}
      {children}
    </>
  )
}
