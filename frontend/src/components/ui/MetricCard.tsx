'use client';

import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  trend?: number;
  icon?: React.ReactNode;
  color?: string;
  compact?: boolean;
}

export default function MetricCard({
  label,
  value,
  suffix,
  prefix,
  decimals = 0,
  trend,
  icon,
  color = 'var(--accent-cyan)',
  compact = false,
}: MetricCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'var(--risk-critical)' : trend && trend < 0 ? 'var(--risk-safe)' : 'var(--text-muted)';

  return (
    <motion.div
      className="glass-panel"
      variants={staggerItem}
      style={{ padding: compact ? 12 : 20 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-caption" style={{ color: 'var(--text-tertiary)', marginBottom: compact ? 4 : 8 }}>
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter
              value={value}
              decimals={decimals}
              prefix={prefix}
              suffix={suffix}
              className={cn('font-mono font-bold', compact ? 'text-xl' : 'text-2xl')}
            />
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2" style={{ color: trendColor }}>
              <TrendIcon size={12} />
              <span className="text-caption">
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
              background: `${color}12`,
              color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
