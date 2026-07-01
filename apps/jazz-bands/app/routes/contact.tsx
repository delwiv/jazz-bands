import { motion } from 'framer-motion'
import { FormattedMessage, useIntl } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { MainContainer } from '~/components/shared/MainContainer'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { buttonVariants } from '~/lib/animationVariants'
import type { ContactLoaderData } from '~/lib/routes.types'
import { buildBandMeta } from '~/utils/seo'
import { loadBand } from '~/lib/loaders'

export async function loader({ request }: LoaderFunctionArgs) {
  return loadBand(request)
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
  const intl = useIntl()

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
      <MainContainer
        variant="glass"
        title={<FormattedMessage id="contact.contact" />}
      >
        <div className="max-w-3xl mx-auto">
          {/* Glass Contact Card */}
          <div className="glass-card shadow-2xl p-10">
            <h2 className="text-3xl font-bold mb-8 text-white">
              <FormattedMessage id="contact.getInTouch" />
            </h2>

            {/* Email Section */}
            {band.contact?.email && (
              <div className="mb-8 p-6 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                <label className="block text-gray-300 font-medium mb-3">
                  <FormattedMessage id="contact.email" />
                </label>
                <a
                  href={`mailto:${band.contact.email}`}
                  className="focus-ring text-gray-300 hover:text-white transition-colors text-xl break-all"
                  style={
                    {
                      '--brand-primary': band.branding?.primaryColor,
                    } as React.CSSProperties
                  }
                  aria-label={intl.formatMessage(
                    { id: 'contact.emailAria' },
                    { bandName: band.name, email: band.contact.email },
                  )}
                >
                  {band.contact.email}
                </a>
              </div>
            )}

            {/* Phone Section */}
            {band.contact?.phone && (
              <div className="mb-8 p-6 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                <label className="block text-gray-300 font-medium mb-3">
                  <FormattedMessage id="contact.phone" />
                </label>
                <p className="text-gray-300 text-xl">{band.contact.phone}</p>
              </div>
            )}

            {/* Mobile Section */}
            {band.contact?.mobile && (
              <div className="mb-8 p-6 bg-white/[0.04] rounded-xl border border-white/[0.05]">
                <label className="block text-gray-300 font-medium mb-3">
                  <FormattedMessage id="contact.mobile" />
                </label>
                <p className="text-gray-300 text-xl">{band.contact.mobile}</p>
              </div>
            )}

            {/* Social Media Section */}
            {band.socialMedia && band.socialMedia.length > 0 && (
              <div className="mb-8">
                <label className="block text-gray-300 font-medium mb-4">
                  <FormattedMessage id="contact.followUs" />
                </label>
                <div className="flex flex-wrap gap-4">
                  {band.socialMedia.map((social: any, idx: number) => {
                    const platform = social.platform?.toLowerCase() || ''
                    const hoverColor =
                      socialColors[platform] || 'hover:text-white'

                    return (
                      <motion.a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`focus-ring bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] text-gray-300 hover:text-white hover:border-white/[0.2] px-5 py-3 rounded-xl transition-all capitalize ${hoverColor}`}
                        variants={!reducedMotion ? buttonVariants : undefined}
                        whileHover={!reducedMotion ? "hover" : undefined}
                        whileTap={!reducedMotion ? "tap" : undefined}
                        aria-label={intl.formatMessage(
                          { id: 'contact.followAria' },
                          { bandName: band.name, platform: social.platform },
                        )}
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
                <FormattedMessage id="contact.bookingInquiries" />{' '}
                <FormattedMessage id="contact.responseTime" />
              </p>
            </div>
          </div>
        </div>
      </MainContainer>
    </>
  )
}
