import { motion } from 'framer-motion'
import { buttonVariants } from '~/lib/animationVariants'

interface PrimaryButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  target?: string
  rel?: string
}

export function PrimaryButton({
  children,
  href,
  onClick,
  disabled,
  className = '',
  target,
  rel,
}: PrimaryButtonProps) {
  const baseClasses =
    'focus-ring px-6 py-3 rounded-lg font-semibold transition-colors'
  const enabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'bg-white text-black hover:bg-white/80 active:bg-white/90'

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={`${baseClasses} ${enabledClasses} ${className}`}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${enabledClasses} ${className}`}
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.button>
  )
}
