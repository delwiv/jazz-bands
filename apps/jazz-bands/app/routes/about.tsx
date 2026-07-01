import { FormattedMessage } from 'react-intl'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { BandStructuredData } from '~/components/StructuredData'
import { MainContainer } from '~/components/shared/MainContainer'
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
  return buildBandMeta(loaderData.band, loaderData.baseUrl, 'about')
}

export default function AboutPage() {
  const { band, baseUrl } = useLoaderData<typeof loader>()

  return (
    <>
      <BandStructuredData band={band} baseUrl={baseUrl} />
      <MainContainer
        variant="glass"
        title={<FormattedMessage id="about.aboutUs" />}
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass-card shadow-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">
              <FormattedMessage id="about.privacyAndAnalytics" />
            </h2>

            <h3 className="text-xl font-semibold mb-4 text-amber-200">
              <FormattedMessage id="about.legitimateTrackingHeading" />
            </h3>

            <p className="text-gray-300 leading-relaxed mb-4">
              <FormattedMessage id="about.legitimateTrackingPara1" />
            </p>

            <p className="text-gray-300 font-medium mb-3">
              <FormattedMessage id="about.legitimateTrackingPara2" />
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">
                  <FormattedMessage id="about.noCookiesBullet" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">
                  <FormattedMessage id="about.noCrossSiteBullet" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">
                  <FormattedMessage id="about.noAdsBullet" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">
                  <FormattedMessage id="about.anonymizedBullet" />
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300">
                  <FormattedMessage id="about.selfHostedBullet" />
                </span>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-4 text-amber-200">
              <FormattedMessage id="about.legalBasisHeading" />
            </h3>

            <p className="text-gray-300 leading-relaxed mb-6">
              <FormattedMessage id="about.legalBasisPara" />
            </p>
          </div>
        </div>
      </MainContainer>
    </>
  )
}
