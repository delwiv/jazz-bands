import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { motion } from 'framer-motion'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { ContactLoaderData } from '~/lib/routes.types'
import { getBandBySlug } from '~/lib/queries'
import { sanityClient } from '~/lib/sanity.settings'
import { buildBandMeta } from '~/utils/seo'

export async function loader({ request }: LoaderFunctionArgs) {
  const bandSlug = process.env.BAND_SLUG

  if (!bandSlug) {
    throw new Error('BAND_SLUG environment variable is required')
  }

  const band = await sanityClient.fetch(getBandBySlug, { slug: bandSlug })

  if (!band) {
    throw new Response('Band not found', { status: 404 })
  }

  // Extract baseUrl as serializable string (Request object not JSON-serializable)
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  return { band, baseUrl }
}

export function meta({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>> | null
}) {
  if (!loaderData?.band) return []
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'contact')
}

export default function ContactPage() {
  const { band, baseUrl } = useLoaderData<ContactLoaderData>()
  const reducedMotion = useReducedMotion()

  // Brand color mapping for social icons
  const socialColors: Record<string, string> = {
    twitter: 'hover:text-[#1DA1F2]',
    facebook: 'hover:text-[#1877F2]',
    instagram: 'hover:text-[#E4405F]',
    spotify: 'hover:text-[#1DB954]',
    youtube: 'hover:text-[#FF0000]',
  }

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        <div className="py-16 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="max-w-3xl mx-auto">
            {/* Hero Title */}
            <h1 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Contact
            </h1>

            {/* Glass Contact Card */}
            <div className="glass-card shadow-2xl p-10">
              <h2 className="text-3xl font-bold mb-8 text-white">Get in Touch</h2>

              {/* Email Section */}
              {band.contact?.email && (
                <div className="mb-8 p-6 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                <label className="block text-gray-300 font-medium mb-3">
                     Email
                   </label>
                  <a
                    href={`mailto:${band.contact.email}`}
                    className="focus-ring text-gray-300 hover:text-white transition-colors text-xl break-all"
                    style={{ '--brand-primary': band.branding?.primaryColor } as React.CSSProperties}
                    aria-label={`Email ${band.name} at ${band.contact.email}`}
                  >
                    {band.contact.email}
                  </a>
                </div>
              )}

              {/* Phone Section */}
              {band.contact?.phone && (
                <div className="mb-8 p-6 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                 <label className="block text-gray-300 font-medium mb-3">
                     Phone
                   </label>
                  <p className="text-gray-300 text-xl">{band.contact.phone}</p>
                </div>
              )}

              {/* Social Media Section */}
              {band.socialMedia && band.socialMedia.length > 0 && (
                <div className="mb-8">
                <label className="block text-gray-300 font-medium mb-4">
                     Follow Us
                   </label>
                  <div className="flex flex-wrap gap-4">
                    {band.socialMedia.map((social: any, idx: number) => {
                      const platform = social.platform?.toLowerCase() || ''
                      const hoverColor = socialColors[platform] || 'hover:text-white'

                      return (
<motion.a
                         key={idx}
                         href={social.url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`focus-ring bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/[0.2] px-5 py-3 rounded-xl transition-all capitalize ${hoverColor}`}
                         whileHover={!reducedMotion
                           ? { scale: 1.05, boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }
                           : undefined}
                         whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
                         aria-label={`Follow ${band.name} on ${social.platform}`}
                       >
                           {social.platform}
                         </motion.a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Footer Message */}
              <div className="border-t border-white/[0.1] pt-6">
              <p className="text-gray-300 leading-relaxed">
                   For booking inquiries, please contact us via email or phone.
                   We typically respond within 48 hours.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
