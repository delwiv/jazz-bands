import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import type { Band } from '~/lib/types'

interface HeaderProps {
  band: Band
}

interface NavLinkProps {
  to: string
  children: React.ReactNode
}

function NavLink({ to, children }: NavLinkProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return (
      <Link to={to} className="text-white hover:opacity-80 relative">
        {children}
      </Link>
    )
  }

  return (
    <Link to={to} className="text-white relative inline-block">
      {children}
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 bg-white"
        initial={{ width: '0%', x: '-100%' }}
        whileHover={{ width: '100%', x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </Link>
  )
}

export function Header({ band }: HeaderProps) {
  const primaryColor = band.branding?.primaryColor || '#1e3a8a'

  return (
    <header style={{ backgroundColor: primaryColor }} className="py-4 px-6">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-white text-2xl font-bold">
          {band.name}
        </Link>

        <div className="flex gap-6">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/musicians">Musicians</NavLink>
          <NavLink to="/tour">Tour</NavLink>
          <NavLink to="/music">Music</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </div>
      </nav>
    </header>
  )
}
