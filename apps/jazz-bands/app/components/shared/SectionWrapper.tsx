import { motion } from 'framer-motion';
import { fadeUpVariants } from '~/lib/animationVariants';
import { useReducedMotion } from '~/hooks/useReducedMotion';

interface SectionWrapperProps {
  children: React.ReactNode;
  title?: string;
  gradient?: 'default' | 'accent' | 'custom';
  className?: string;
  id?: string;
}

export function SectionWrapper({
  children,
  title,
  gradient = 'default',
  className = '',
  id,
}: SectionWrapperProps) {
  const isReducedMotion = useReducedMotion();

  const gradients = {
    default: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    accent: 'bg-gradient-to-b from-slate-900 to-slate-800',
    custom: '',
  };

  return (
    <section
      id={id}
      className={`section-base ${gradients[gradient]} ${className}`}
      aria-labelledby={title ? 'title' : undefined}
    >
      <div className="container-max">
        {title && (
          <motion.h2
            id="title"
            className="text-4xl font-bold text-center mb-12 text-white"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            animate={!isReducedMotion}
          >
            {title}
          </motion.h2>
        )}
        {children}
      </div>
    </section>
  );
}
