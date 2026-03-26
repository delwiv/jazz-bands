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

     // Glass effect for consistent appearance
    const glassClasses =
      'bg-slate-950/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 md:p-10'

    const gradients = {
      default: '',
      accent: '',
      custom: '',
    }

    return (
      <section
        id={id}
        className={`section-base ${gradients[gradient]} ${glassClasses} ${className}`}
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
