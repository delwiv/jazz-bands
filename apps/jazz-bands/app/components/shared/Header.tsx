import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { navUnderlineVariants } from '~/lib/animationVariants'
import type { Band } from '~/lib/types'

interface HeaderProps {
  band: Band
}

interface NavLinkProps {
  to: string
  children: React.ReactNode
  primaryColor: string
}

function NavLink({ to, children, primaryColor }: NavLinkProps) {
  const reducedMotion = useReducedMotion()
  const location = useLocation()
  const isActive = location.pathname === to

  if (reducedMotion) {
    return (
      <Link
        to={to}
        className={`focus-ring hover:opacity-80 relative px-1 ${isActive ? 'text-white' : 'text-gray-300'
          }`}
      >
        {children}
        {isActive && (
          <span
            className="absolute bottom-0 left-0 h-0.5"
            style={{ backgroundColor: primaryColor }}
          />
        )}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="focus-ring relative inline-block px-1 text-gray-300 hover:text-white"
    >
      {children}
      <AnimatePresence>
        <motion.span
          variants={navUnderlineVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute bottom-0 left-0 h-0.5"
          style={{ borderColor: primaryColor, backgroundColor: primaryColor }}
        />
      </AnimatePresence>
    </Link>
  )
}

export function Header({ band }: HeaderProps) {
  const intl = useIntl()
  const primaryColor = band.branding?.primaryColor || '#1e3a8a'
  const logoTint = primaryColor.replace(')', ', 0.8)').replace('rgb', 'rgba')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="glass-card border-b border-white/[0.1] py-4 flex w-full h-16 md:px-6 sticky top-0 z-50">
      <nav className="max-w-7xl flex items-center justify-between w-full">
        <Link
          to="/"
          className="focus-ring text-2xl font-bold text-white"
          style={{ color: logoTint }}
          onClick={() => setIsMenuOpen(false)}
        >
          {band.name}
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="focus-ring p-2 md:hidden hover:bg-white/[0.1] rounded-lg transition-colors"
          aria-label={intl.formatMessage({
            id: isMenuOpen ? 'header.closeMenu' : 'header.openMenu',
          })}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Desktop Navigation */}
        <div className="flex gap-6 hidden md:flex">
          <NavLink to="/" primaryColor={primaryColor}>
            <FormattedMessage id="header.home" />
          </NavLink>
          <NavLink to="/musicians" primaryColor={primaryColor}>
            <FormattedMessage id="header.musicians" />
          </NavLink>
          <NavLink to="/tour" primaryColor={primaryColor}>
            <FormattedMessage id="header.tour" />
          </NavLink>
          <NavLink to="/gallery" primaryColor={primaryColor}>
            <FormattedMessage id="header.gallery" />
          </NavLink>
          <NavLink to="/contact" primaryColor={primaryColor}>
            <FormattedMessage id="header.contact" />
          </NavLink>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-b border-white/10 shadow-xl md:hidden"
            >
              <div className="flex flex-col p-4 space-y-2">
                <Link
                  to="/"
                  className="focus-ring py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FormattedMessage id="header.home" />
                </Link>
                <Link
                  to="/musicians"
                  className="focus-ring py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FormattedMessage id="header.musicians" />
                </Link>
                <Link
                  to="/tour"
                  className="focus-ring py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FormattedMessage id="header.tour" />
                </Link>
                <Link
                  to="/gallery"
                  className="focus-ring py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FormattedMessage id="header.gallery" />
                </Link>
                <Link
                  to="/contact"
                  className="focus-ring py-3 px-4 text-white hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FormattedMessage id="header.contact" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </nav>
    </header>
  )
}
