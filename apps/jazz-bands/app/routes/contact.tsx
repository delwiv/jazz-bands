import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { motion } from 'framer-motion'
import { BandStructuredData } from '~/components/StructuredData'
import { Layout } from '~/components/shared/Layout'
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

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <Layout band={band}>
        <div className="py-16 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-12">Contact</h1>

            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

              {band.contact?.email && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email
                  </label>
                  <a
                    href={`mailto:${band.contact.email}`}
                    className="text-blue-600 hover:underline text-lg"
                  >
                    {band.contact.email}
                  </a>
                </div>
              )}

              {band.contact?.phone && (
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone
                  </label>
                  <p className="text-lg">{band.contact.phone}</p>
                </div>
              )}

              {band.socialMedia && band.socialMedia.length > 0 && (
                <div className="mb-8">
                  <label className="block text-gray-700 font-semibold mb-4">
                    Follow Us
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {band.socialMedia.map((social: any, idx: number) => (
                      <motion.a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition capitalize"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {social.platform}
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <p className="text-gray-600">
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
