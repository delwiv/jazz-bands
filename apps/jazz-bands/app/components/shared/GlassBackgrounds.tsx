import React from 'react'

export function GlassSection({
  children,
  childrenClassName = '',
  className = '',
  id,
}: {
  children: React.ReactNode
  childrenClassName?: string
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={`relative bg-slate-950/70 backdrop-blur-sm border-y border-white/10 ${className}`}
    >
      <div className={`max-w-7xl mx-auto px-3 py-16 md:py-24 ${childrenClassName}`}>
        {children}
      </div>
    </section>
  )
}

export function GlassFooter({
  children,
  childrenClassName = '',
  className = '',
}: {
  children: React.ReactNode
  childrenClassName?: string
  className?: string
}) {
  return (
    <footer
      className={`relative bg-slate-950/85 backdrop-blur-md border-t border-white/15 ${className}`}
    >
      <div className={`max-w-7xl mx-auto px-3 py-12 ${childrenClassName}`}>
        {children}
      </div>
    </footer>
  )
}
