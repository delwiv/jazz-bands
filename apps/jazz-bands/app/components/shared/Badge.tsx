import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-white/[0.08] border-white/[0.1] text-white/80',
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200',
    warning: 'bg-amber-500/20 border-emerald-500/30 text-amber-200',
  };

  return (
    <span className={`glass-badge border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
