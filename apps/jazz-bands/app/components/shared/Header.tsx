import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import type { Band } from '~/lib/types'
import { navUnderlineVariants } from '~/lib/animationVariants'

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
        className={`focus-ring hover:opacity-80 relative px-1 ${
          isActive ? 'text-white' : 'text-gray-300'
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
  const primaryColor = band.branding?.primaryColor || '#1e3a8a'
  const logoTint = primaryColor.replace(')', ', 0.8)').replace('rgb', 'rgba')

  return (
    <header
      className="bg-white/[0.06] backdrop-blur-xl border-b border-white/[0.1] py-4 px-6 sticky top-0 z-50"
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="focus-ring text-2xl font-bold text-white"
          style={{ color: logoTint }}
        >
          {band.name}
        </Link>

        <div className="flex gap-6">
          <NavLink to="/" primaryColor={primaryColor}>
            Home
          </NavLink>
          <NavLink to="/musicians" primaryColor={primaryColor}>
            Musicians
          </NavLink>
          <NavLink to="/tour" primaryColor={primaryColor}>
            Tour
          </NavLink>
          <NavLink to="/contact" primaryColor={primaryColor}>
            Contact
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
