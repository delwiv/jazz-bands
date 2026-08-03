import { PortableText as BasePortableText } from '@portabletext/react'
import type { PTBlock } from '../lib/types'

const components = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-5 text-ink/85 leading-relaxed md:text-lg">{children}</p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mt-8 mb-4 font-display text-2xl font-semibold text-ink">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mt-6 mb-3 font-display text-xl font-semibold text-ink">
        {children}
      </h3>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-6 border-l-2 border-brass pl-4 italic text-ink/80">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-ink/90">{children}</em>
    ),
    link: ({
      children,
      value,
    }: {
      children?: React.ReactNode
      value?: { href?: string }
    }) => (
      <a
        href={value?.href}
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        rel={
          value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined
        }
        className="text-wine underline decoration-brass/60 underline-offset-4 hover:decoration-wine"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-5 list-disc pl-6 text-ink/85 md:text-lg">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-5 list-decimal pl-6 text-ink/85 md:text-lg">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="mb-1.5">{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="mb-1.5">{children}</li>
    ),
  },
}

export function PortableText({ value }: { value?: PTBlock[] }) {
  if (!value || value.length === 0) return null
  return <BasePortableText value={value} components={components} />
}
