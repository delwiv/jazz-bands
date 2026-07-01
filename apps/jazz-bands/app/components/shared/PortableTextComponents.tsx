import type { PortableTextComponents } from '@portabletext/react'

export const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h3 className="text-2xl font-bold mb-4">{children}</h3>,
    h2: ({ children }) => <h4 className="text-xl font-semibold mb-3">{children}</h4>,
    h3: ({ children }) => <h5 className="text-lg font-medium mb-2">{children}</h5>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a href={value.href} className="text-blue-400 hover:underline">
        {children}
      </a>
    ),
  },
}
