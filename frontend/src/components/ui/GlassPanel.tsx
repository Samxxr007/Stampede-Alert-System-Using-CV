'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  layoutId?: string;
}

const paddingMap = {
  none: '',
  sm: 'padding: 8px;',
  md: 'padding: 16px;',
  lg: 'padding: 24px;',
  xl: 'padding: 32px;',
};

export default function GlassPanel({
  children,
  className,
  interactive = false,
  glow = false,
  padding = 'lg',
  onClick,
  layoutId,
}: GlassPanelProps) {
  const baseClass = interactive ? 'glass-panel-interactive' : 'glass-panel';

  return (
    <motion.div
      layoutId={layoutId}
      className={cn(baseClass, glow && 'animate-breathe', className)}
      onClick={onClick}
      style={{
        padding:
          padding === 'none'
            ? 0
            : padding === 'sm'
            ? 8
            : padding === 'md'
            ? 16
            : padding === 'xl'
            ? 32
            : 24,
      }}
      whileHover={interactive ? { y: -2, borderColor: 'rgba(0, 212, 255, 0.2)' } : undefined}
      whileTap={interactive ? { scale: 0.99 } : undefined}
    >
      {children}
    </motion.div>
  );
}
