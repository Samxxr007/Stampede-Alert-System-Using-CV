'use client';

import { motion } from 'framer-motion';

interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'processing';
  size?: number;
  label?: string;
}

const statusColors: Record<string, string> = {
  online: '#10b981',
  offline: 'rgba(255,255,255,0.2)',
  warning: '#f59e0b',
  error: '#ef4444',
  processing: '#00d4ff',
};

export default function StatusDot({ status, size = 8, label }: StatusDotProps) {
  const color = statusColors[status] || statusColors.offline;
  const isAnimated = status === 'online' || status === 'processing' || status === 'warning' || status === 'error';

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative" style={{ width: size, height: size }}>
        {isAnimated && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: isAnimated ? `0 0 6px ${color}` : 'none',
          }}
        />
      </span>
      {label && (
        <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
