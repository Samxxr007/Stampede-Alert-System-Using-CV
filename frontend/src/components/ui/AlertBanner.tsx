'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { alertSlideIn } from '@/lib/animations';
import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { AlertPriority } from '@/types';

interface AlertBannerProps {
  id: string | number;
  title: string;
  message?: string;
  priority: AlertPriority;
  onDismiss?: () => void;
  autoDismiss?: number;
}

const priorityConfig: Record<AlertPriority, { icon: React.ElementType; color: string; bgColor: string }> = {
  [AlertPriority.Info]: { icon: Info, color: '#00d4ff', bgColor: 'rgba(0,212,255,0.08)' },
  [AlertPriority.Warning]: { icon: AlertTriangle, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)' },
  [AlertPriority.Critical]: { icon: AlertCircle, color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)' },
};

export default function AlertBanner({ id, title, message, priority, onDismiss, autoDismiss }: AlertBannerProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <motion.div
      key={id}
      variants={alertSlideIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="glass-panel"
      style={{
        padding: '12px 16px',
        borderLeft: `3px solid ${config.color}`,
        background: config.bgColor,
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        maxWidth: 400,
      }}
    >
      <Icon size={16} style={{ color: config.color, marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>{title}</p>
        {message && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{message}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="btn-icon"
          style={{ width: 24, height: 24, flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

// ── Alert Stack Container ──

export function AlertStack({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 72,
        right: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
}
