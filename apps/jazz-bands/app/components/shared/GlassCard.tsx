import { motion } from 'framer-motion';
import { cardHoverVariants } from '~/lib/animationVariants';
import { useReducedMotion } from '~/hooks/useReducedMotion';

interface GlassCardProps {
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GlassCard({
  children,
  hover = true,
  onClick,
  className = '',
}: GlassCardProps) {
  const isReducedMotion = useReducedMotion();
  const hasHover = hover && !isReducedMotion;

  return (
    <motion.div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`glass-card cursor-none ${
        hasHover ? 'cursor-pointer' : ''
      } ${className}`}
      initial="initial"
      animate="hover"
      whileHover={hasHover ? 'hover' : undefined}
      variants={cardHoverVariants}
    >
      {children}
    </motion.div>
  );
}
