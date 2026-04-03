import { FormattedMessage } from 'react-intl'
import type { Band } from '~/lib/types'

interface FooterProps {
  band: Band
}

export function Footer({ band }: FooterProps) {
  const secondaryColor = band.branding?.secondaryColor || '#dc2626'

  return (
    <footer className="relative glass-card border-t py-12 rounded-t-lg w-full">
      <div className="max-w-7xl mx-auto px-3 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3
            className="font-bold text-lg mb-4 text-gray-300 hover:text-opacity-100 transition-colors"
            style={{ color: secondaryColor }}
          >
            {band.name}
          </h3>
          <p className="text-gray-300">
            {band.description?.[0]?.children?.[0]?.text || 'Jazz band'}
          </p>
        </div>

        <div>
          <h4 className="text-gray-300 font-bold mb-4">
            <FormattedMessage id="footer.contact" />
          </h4>
          {band.contact?.email && (
            <p className="text-gray-300">📧 {band.contact.email}</p>
          )}
          {band.contact?.phone && (
            <p className="text-gray-300">📞 {band.contact.phone}</p>
          )}
        </div>

        <div>
          <h4 className="text-gray-300 font-bold mb-4">
            <FormattedMessage id="footer.followUs" />
          </h4>
          <div className="flex gap-4">
            {band.socialMedia?.map((social, idx) => (
              <a
                key={idx}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-gray-300 hover:text-white transition-colors"
                aria-label={social.platform}
              >
                {social.platform}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/[0.1] text-center text-gray-300">
        <p>
          © {new Date().getFullYear()} {band.name}.{' '}
          <FormattedMessage id="footer.allRightsReserved" />
        </p>
      </div>
    </footer>
  )
}
