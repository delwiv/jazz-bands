/**
 * SEO Utility Functions
 *
 * Helper functions for generating meta tags, canonical URLs,
 * and handling environment-based multi-tenancy SEO.
 */

import type { MetaFunction } from 'react-router'

/**
 * Get the base URL from request (protocol + host)
 */
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url)

  return `${url.protocol}//${url.host}`
}

/**
 * Get canonical URL for current page
 */
export function getCanonicalUrl(
  request: Request,
  pathname = url.pathname,
): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}${pathname}`
}

/**
 * Truncate text to character limit, adding ellipsis if needed
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number,
  addEllipsis = true,
): string {
  if (!text) return ''

  if (text.length <= maxLength) return text

  return addEllipsis
    ? `${text.slice(0, maxLength - 3).trim()}...`
    : text.slice(0, maxLength).trim()
}

/**
 * Generate default meta title if not provided
 */
export function generateMetaTitle(
  bandName: string,
  page: string = '',
  suffix: string = 'Jazz Band',
): string {
  if (page) {
    return `${bandName} - ${page}`
  }
  return `${bandName} - ${suffix}`
}

/**
 * Generate default meta description if not provided
 */
export function generateMetaDescription(
  description: string | null | undefined,
  maxLength: number = 160,
): string {
  return truncate(description, maxLength)
}

/**
 * Generate Open Graph image URL
 * Falls back to default OG image if not provided
 */
export function getOgImageUrl(
  baseUrl: string,
  imageUrl: string | null | undefined,
  fallback: string = '/og-default.jpg',
): string {
  if (imageUrl) {
    return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
  }
  return `${baseUrl}${fallback}`
}

/**
 * Merge parent and child meta tags
 * Child meta overrides parent meta with same key
 */
export function mergeMeta(
  parentMeta: ReturnType<MetaFunction>,
  childMeta: ReturnType<MetaFunction>,
): ReturnType<MetaFunction> {
  const metaMap = new Map<string, any>()

  // Helper to generate unique key for meta descriptor
  const getMetaKey = (meta: any): string => {
    if (meta.title) return `title:${meta.title}`
    if (meta.name) return `name:${meta.name}`
    if (meta.property) return `property:${meta.property}`
    if (meta.rel) return `rel:${meta.rel}`
    if (meta.charset) return `charset:${meta.charset}`
    if (meta.href) return `href:${meta.href}`
    return `other:${JSON.stringify(meta)}`
  }

  // Start with parent meta
  ;(parentMeta || []).forEach((meta) => {
    const key = getMetaKey(meta)
    metaMap.set(key, meta)
  })

  // Override with child meta
  ;(childMeta || []).forEach((meta) => {
    const key = getMetaKey(meta)
    metaMap.set(key, meta)
  })

  return Array.from(metaMap.values())
}

/**
 * Build complete meta tags for a band page
 * Accepts partial band data - will generate defaults for missing fields
 */
export function buildBandMeta(
  band: {
    name: string
    slug: { current: string }
    description?: Array<{ children: Array<{ text: string }> }> | string[] | null
    logo?: any
    seo?: {
      metaTitle?: string
      metaDescription?: string
      metaKeywords?: string[]
    }
    openGraph?: {
      title?: string
      description?: string
      image?: any
      type?: string
    }
    twitterCard?: {
      card?: string
      title?: string
      description?: string
      image?: any
      creator?: string
    }
  },
  baseUrl: string,
  page: 'home' | 'musicians' | 'tour' | 'music' | 'contact' | 'gallery' = 'home',
  pageDescription?: string,
): ReturnType<MetaFunction> {
  const canonicalUrl = baseUrl

  // Generate descriptions from Sanity blocks if needed
  const descriptionText = Array.isArray(band.description)
    ? band.description
        .map(
          (block: any) =>
            block.children?.map((t: any) => t.text).join('') || '',
        )
        .join(' ')
    : ''

  // Meta Title
  const metaTitle = band.seo?.metaTitle || generateMetaTitle(band.name, page)

  // Meta Description
  const metaDescription =
    band.seo?.metaDescription ||
    generateMetaDescription(pageDescription || descriptionText, 160)

  // Open Graph
  const ogTitle = band.openGraph?.title || metaTitle
  const ogDescription =
    band.openGraph?.description ||
    generateMetaDescription(pageDescription || descriptionText, 200)
  const ogImage = getOgImageUrl(baseUrl, null)

  // Twitter Card
  const twitterCard = band.twitterCard?.card || 'summary_large_image'
  const twitterTitle = band.twitterCard?.title || ogTitle
  const twitterDescription = band.twitterCard?.description || ogDescription
  const twitterImage = ogImage
  const twitterCreator = band.twitterCard?.creator || `@${band.slug.current}`

  const meta: ReturnType<MetaFunction> = [
    // Basic Meta Tags
    { title: metaTitle },
    { name: 'description', content: metaDescription },
    ...(band.seo?.metaKeywords || []).map((keyword) => ({
      name: 'keywords',
      content: keyword,
    })),

    // Canonical URL
    {
      tagName: 'link',
      rel: 'canonical',
      href: canonicalUrl,
    },

    // Charset & Viewport
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },

    // Robots
    { name: 'robots', content: 'index, follow' },

    // Open Graph Tags
    { property: 'og:type', content: band.openGraph?.type || 'website' },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: band.name },

    // Twitter Card Tags
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: twitterTitle },
    { name: 'twitter:description', content: twitterDescription },
    { name: 'twitter:image', content: twitterImage },
    { name: 'twitter:creator', content: twitterCreator },
    { name: 'twitter:site', content: twitterCreator },
  ]

  return meta
}
