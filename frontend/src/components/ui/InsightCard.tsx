'use client';

import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import { AlertTriangle, Lightbulb, Shield, Eye } from 'lucide-react';

interface InsightCardProps {
  category: string;
  title: string;
  description: string;
  confidence: number;
  severity: 'info' | 'warning' | 'critical';
  action?: string;
  onClick?: () => void;
}

const severityConfig = {
  info: { icon: Lightbulb, color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
  warning: { icon: AlertTriangle, color: 'var(--risk-warning)', bg: 'var(--risk-warning-dim)' },
  critical: { icon: Shield, color: 'var(--risk-critical)', bg: 'var(--risk-critical-dim)' },
};

export default function InsightCard({
  category,
  title,
  description,
  confidence,
  severity,
  action,
  onClick,
}: InsightCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      variants={staggerItem}
      className="glass-panel-interactive"
      style={{ padding: 20, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: config.bg,
            color: config.color,
          }}
        >
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-overline" style={{ color: config.color }}>{category}</span>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginTop: 2 }}>
            {title}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        {description}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${confidence}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        </div>
        <span className="text-mono text-caption" style={{ color: config.color }}>
          {confidence.toFixed(0)}%
        </span>
      </div>

      {/* Action */}
      {action && (
        <div
          className="flex items-center gap-2 mt-3 pt-3"
          style={{ borderTop: '1px solid var(--glass-border)' }}
        >
          <Eye size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span className="text-caption" style={{ color: 'var(--accent-cyan)' }}>
            {action}
          </span>
        </div>
      )}
    </motion.div>
  );
}
